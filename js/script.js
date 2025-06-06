document.addEventListener('DOMContentLoaded', function() {

    // --- Header and Navigation Logic ---
    const searchIcon = document.querySelector('.search-icon');
    const searchOverlay = document.querySelector('.search-overlay');
    const closeSearch = document.querySelector('.close-search');
    const searchInput = document.getElementById('searchInput');

    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const overlay = document.querySelector('.overlay');

    // Open Search Overlay
    searchIcon.addEventListener('click', function(e) {
        e.preventDefault();
        searchOverlay.classList.add('active');
        searchInput.focus();
        document.body.style.overflow = 'hidden';
    });

    // Close Search Overlay
    closeSearch.addEventListener('click', function() {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        document.body.style.overflow = '';
    });

    // Close search overlay if clicked outside input
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
            document.body.style.overflow = '';
        }
    });

    // Open Cart Sidebar
    cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close Cart Sidebar
    closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close overlays if overlay clicked
    overlay.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Navigation link highlight based on scroll
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('nav ul li a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const headerHeight = document.querySelector('header').offsetHeight;
            if (pageYOffset >= sectionTop - headerHeight - 50) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - document.querySelector('header').offsetHeight,
                    behavior: 'smooth'
                });
            }
            // Update active link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- Shopping Cart Logic ---
    let cart = [];

    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalSpan = document.getElementById('cartTotal');
    const cartCountSpan = document.querySelector('.cart-icon span');
    const emptyCartMessage = document.querySelector('.empty-cart-message');

    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('farmFreshCart', JSON.stringify(cart));
    }

    // Load cart from localStorage
    function loadCart() {
        const stored = localStorage.getItem('farmFreshCart');
        if (stored) {
            try {
                cart = JSON.parse(stored);
                renderCart();
            } catch(e) {
                cart = [];
            }
        }
    }

    // Render cart items
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
        } else {
            emptyCartMessage.style.display = 'none';
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'cart-item';

                cartItemDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <span class="cart-item-price">₹ ${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="decrease-quantity" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-id="${item.id}">+</button>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">×</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
                total += item.price * item.quantity;
                totalItems += item.quantity;
            });
        }
        // Update totals
        cartTotalSpan.textContent = `₹ ${total.toFixed(2)}`;
        cartCountSpan.textContent = totalItems;
        saveCart();
    }

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = parseInt(productCard.dataset.productId);
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = parseFloat(productCard.querySelector('.price').dataset.price);
            const productImage = productCard.querySelector('img').src;

            const existing = cart.find(item => item.id === productId);
            if (existing) {
                existing.quantity++;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }
            renderCart();
            // Open cart sidebar
            cartSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Cart item quantity & removal
    document.querySelector('.cart-items').addEventListener('click', function(e) {
        if (e.target.classList.contains('increase-quantity')) {
            const id = parseInt(e.target.dataset.id);
            const item = cart.find(i => i.id === id);
            if (item) {
                item.quantity++;
                renderCart();
            }
        } else if (e.target.classList.contains('decrease-quantity')) {
            const id = parseInt(e.target.dataset.id);
            const item = cart.find(i => i.id === id);
            if (item && item.quantity > 1) {
                item.quantity--;
                renderCart();
            } else if (item && item.quantity === 1) {
                cart = cart.filter(i => i.id !== id);
                renderCart();
            }
        } else if (e.target.classList.contains('cart-item-remove')) {
            const id = parseInt(e.target.dataset.id);
            cart = cart.filter(i => i.id !== id);
            renderCart();
        }
    });

    // --- Checkout and Inquiry Logic ---
    const checkoutBtn = document.querySelector('.checkout-btn');
    const contactSection = document.getElementById('contact');
    const messageInput = document.getElementById('message');
    const deliveryForm = document.getElementById('deliveryForm');

    // Set min date/time to tomorrow 9:00 AM IST
    const deliveryDateInput = document.getElementById('deliveryDateTime');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const minDateStr = tomorrow.toISOString().slice(0, 16);
    deliveryDateInput.min = minDateStr;

    // Handle checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                // Close cart overlay
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';

                let cartSummary = "Your Order Summary:\n";
                cart.forEach(item => {
                    cartSummary += `- ${item.quantity} x ${item.name} (₹ ${(item.price * item.quantity).toFixed(2)})\n`;
                });
                cartSummary += `Total: ₹ ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}\n\n`;
                cartSummary += "Add any special delivery instructions below:";

                messageInput.value = cartSummary;

                // Remove existing hidden inputs
                ['submissionTypeHidden', 'cartDataHidden', 'inquiryProductIdHidden'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                });

                // Append hidden inputs for order
                const submissionTypeInput = document.createElement('input');
                submissionTypeInput.type = 'hidden';
                submissionTypeInput.name = 'submission_type';
                submissionTypeInput.value = 'order';
                submissionTypeInput.id = 'submissionTypeHidden';

                const cartDataInput = document.createElement('input');
                cartDataInput.type = 'hidden';
                cartDataInput.name = 'cart_data';
                cartDataInput.value = JSON.stringify(cart);
                cartDataInput.id = 'cartDataHidden';

                deliveryForm.appendChild(submissionTypeInput);
                deliveryForm.appendChild(cartDataInput);

                // Scroll to form
                contactSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Your cart is empty. Please add items before checking out.');
            }
        });
    }

    // Enquire Now buttons
    document.querySelectorAll('.enquire-now-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productCard = btn.closest('.product-card');
            const productId = parseInt(productCard.dataset.productId);
            const productName = productCard.querySelector('h3').textContent;

            const inquiryMsg = `Enquiry for: ${productName}\n\nI am interested in ordering this product. Please provide more details or confirm availability.`;
            messageInput.value = inquiryMsg;

            // Remove existing hidden inputs
            ['submissionTypeHidden', 'cartDataHidden', 'inquiryProductIdHidden'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });

            // Append hidden inputs for inquiry
            const submissionTypeInput = document.createElement('input');
            submissionTypeInput.type = 'hidden';
            submissionTypeInput.name = 'submission_type';
            submissionTypeInput.value = 'inquiry';
            submissionTypeInput.id = 'submissionTypeHidden';

            const inquiryProductIdInput = document.createElement('input');
            inquiryProductIdInput.type = 'hidden';
            inquiryProductIdInput.name = 'inquiry_product_id';
            inquiryProductIdInput.value = productId;
            inquiryProductIdInput.id = 'inquiryProductIdHidden';

            deliveryForm.appendChild(submissionTypeInput);
            deliveryForm.appendChild(inquiryProductIdInput);

            // Scroll to form
            contactSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- Delivery Form Submission ---
    const formMessage = document.getElementById('formMessage');

    // Set min date/time for delivery
    // Already set earlier

    if (deliveryForm) {
        deliveryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formMessage.textContent = '';
            formMessage.classList.remove('success', 'error');

            const formData = new FormData(deliveryForm);

            try {
                const response = await fetch('farm.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.text();

                // Display response
                formMessage.textContent = data;
                if (data.toLowerCase().includes("success") || data.toLowerCase().includes("order placed")) {
                    formMessage.style.color = '#2c5f2d';
                    formMessage.classList.add('success');
                    deliveryForm.reset();

                    // Reset min date
                    deliveryDateInput.min = minDateStr;

                    // Clear cart if order was successful
                    if (data.toLowerCase().includes("order placed")) {
                        cart = [];
                        renderCart();
                        localStorage.removeItem('farmFreshCart');
                    }
                } else {
                    formMessage.style.color = 'red';
                    formMessage.classList.add('error');
                }
            } catch (err) {
                console.error('Error:', err);
                formMessage.textContent = 'An unexpected error occurred. Please try again.';
                formMessage.style.color = 'red';
                formMessage.classList.add('error');
            }
        });
    }

    // --- Initialize ---
    loadCart();

});