<?php
// Enable detailed error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type for debugging output
header('Content-Type: text/plain');

// --- 1. Database Configuration ---
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'farm_fresh_ecommerce');

// --- 2. Connect to Database ---
$mysqli = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}
$mysqli->set_charset("utf8mb4");

// --- 3. Check request method ---
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Invalid request method. Please send a POST request.");
}

// --- 4. Collect and sanitize input data ---
$fullName = htmlspecialchars(trim($_POST['fullName'] ?? ''));
$phoneNumber = htmlspecialchars(trim($_POST['phoneNumber'] ?? ''));
$email = htmlspecialchars(trim($_POST['email'] ?? ''));
$deliveryArea = htmlspecialchars(trim($_POST['deliveryArea'] ?? ''));
$message = htmlspecialchars(trim($_POST['message'] ?? ''));
$deliveryDateTime = htmlspecialchars(trim($_POST['deliveryDateTime'] ?? ''));
$submission_type = htmlspecialchars(trim($_POST['submission_type'] ?? ''));

// --- 5. Basic validation ---
if (empty($fullName) || empty($phoneNumber) || empty($deliveryArea) || empty($deliveryDateTime)) {
    die("Error: Missing required fields: fullName, phoneNumber, deliveryArea, or deliveryDateTime.");
}

// Initialize response message
$response_message = "";

// Start transaction
$mysqli->begin_transaction();

try {
    if ($submission_type === 'order') {
        // Handle Order Submission
        $cart_data_json = $_POST['cart_data'] ?? '[]';

        // Decode JSON cart data
        $cartItems = json_decode($cart_data_json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in cart_data: " . json_last_error_msg());
        }

        // Insert into 'orders'
        $stmt_order = $mysqli->prepare(
            "INSERT INTO orders (full_name, phone_number, email, delivery_area, delivery_datetime, notes, order_date)
             VALUES (?, ?, ?, ?, ?, ?, NOW())"
        );
        if (!$stmt_order) {
            throw new Exception("Prepare failed for orders: " . $mysqli->error);
        }
        $stmt_order->bind_param("ssssss", $fullName, $phoneNumber, $email, $deliveryArea, $deliveryDateTime, $message);
        $stmt_order->execute();

        $order_id = $mysqli->insert_id;
        if (!$order_id) {
            throw new Exception("Failed to insert order: " . $stmt_order->error);
        }

        // Insert order items
        if (!empty($cartItems)) {
            $stmt_item = $mysqli->prepare(
                "INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit)
                 VALUES (?, ?, ?, ?, ?)"
            );
            if (!$stmt_item) {
                throw new Exception("Prepare failed for order_items: " . $mysqli->error);
            }

            foreach ($cartItems as $item) {
                $productId = intval($item['id'] ?? 0);
                $productName = htmlspecialchars(trim($item['name'] ?? ''));
                $quantity = intval($item['quantity'] ?? 0);
                $price = floatval($item['price'] ?? 0);

                if ($productId > 0 && $quantity > 0 && $price >= 0) {
                    $stmt_item->bind_param("iisid", $order_id, $productId, $productName, $quantity, $price);
                    $stmt_item->execute();
                } else {
                    throw new Exception("Invalid cart item data: " . json_encode($item));
                }
            }
            $stmt_item->close();
        }

        // Commit transaction
        $mysqli->commit();

        $response_message = "Success: Your order (ID: $order_id) has been placed successfully! We'll contact you shortly to confirm.";

    } elseif ($submission_type === 'inquiry') {
        // Handle Inquiry
        $inquiry_product_id = htmlspecialchars(trim($_POST['inquiry_product_id'] ?? 'N/A'));

        $stmt_inquiry = $mysqli->prepare(
            "INSERT INTO inquiries (full_name, phone_number, email, delivery_area, inquiry_product_id, message, inquiry_date)
             VALUES (?, ?, ?, ?, ?, ?, NOW())"
        );
        if (!$stmt_inquiry) {
            throw new Exception("Prepare failed for inquiries: " . $mysqli->error);
        }

        $stmt_inquiry->bind_param("ssssss", $fullName, $phoneNumber, $email, $deliveryArea, $inquiry_product_id, $message);
        $stmt_inquiry->execute();

        if ($stmt_inquiry->affected_rows === 0) {
            throw new Exception("Failed to insert inquiry: " . $stmt_inquiry->error);
        }

        $response_message = "Success: Your inquiry has been sent successfully! We'll get back to you soon.";
        $stmt_inquiry->close();

    } else {
        // Unknown submission type - fallback message
        error_log("Unknown submission_type: '$submission_type' from $fullName. Message: $message");
        $response_message = "Success: Your message has been sent successfully!";
    }

    // Commit after successful processing
    $mysqli->commit();

} catch (Exception $e) {
    // Rollback on error
    $mysqli->rollback();
    die("Server Error: " . $e->getMessage());
}

// --- 7. Output success message ---
echo $response_message;

// --- 8. Close connection ---
$mysqli->close();
?>