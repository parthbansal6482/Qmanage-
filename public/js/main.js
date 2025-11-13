/**
 * Main JavaScript file for Qmanage Food Ordering Website
 * Contains Cart functionality and shared utilities
 */

// Cart functionality
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cartItems')) || [];
        this.outletId = localStorage.getItem('cartOutletId') || null;
        this.previousItems = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Cart button click
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            cartButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart();
            });
        }

        // Close cart
        const cartClose = document.getElementById('cartClose');
        if (cartClose) {
            cartClose.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Close cart on overlay click
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Place Order
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Place Order button clicked');
                console.log('Button disabled?', checkoutBtn.disabled);
                console.log('Cart items:', this.items);
                console.log('Cart outletId:', this.outletId);
                
                // Check if button is disabled
                if (checkoutBtn.disabled) {
                    console.log('Button is disabled, cannot proceed');
                    return;
                }
                
                if (!this.items || this.items.length === 0) {
                    window.Utils.NotificationManager.show('Add items before checking out.', 'warning');
                    return;
                }
                
                // Check if all items have outlet and menuItem ID
                const outletId = this.outletId || this.items[0]?.outletId;
                
                if (!outletId) {
                    console.log('No outlet ID found, showing warning');
                    window.Utils.NotificationManager.show(
                        'Please add items from an outlet first. Go to the Order page to select an outlet.',
                        'warning'
                    );
                    // Still allow redirect for testing - remove this later
                    // return;
                }

                // Check if items have menuItem IDs
                const itemsWithoutMenuItemId = this.items.filter(item => !item.menuItemId);
                if (itemsWithoutMenuItemId.length > 0) {
                    console.log('Some items missing menuItemId:', itemsWithoutMenuItemId);
                    window.Utils.NotificationManager.show(
                        'Some items are missing menu information. Please add items from the Order page.',
                        'warning'
                    );
                    // Still allow redirect for testing - remove this later
                    // return;
                }

                // Redirect to checkout page
                console.log('Redirecting to checkout page...');
                window.location.href = '/checkout';
            });
        } else {
            console.error('checkoutBtn not found!');
        }
    }

    addItem(item) {
        console.log('Adding item:', item);
        console.log('Current cart items before:', this.items);
        
        // If item has outletId, set it on cart if cart doesn't have one
        if (item.outletId && !this.outletId) {
            this.outletId = item.outletId;
            console.log('Setting cart outletId from item:', item.outletId);
        }
        
        const existingItem = this.items.find(cartItem => cartItem.name === item.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
            // Update outletId and menuItemId if the new item has them
            if (item.outletId && !existingItem.outletId) {
                existingItem.outletId = item.outletId;
            }
            if (item.menuItemId && !existingItem.menuItemId) {
                existingItem.menuItemId = item.menuItemId;
            }
            console.log('Updated existing item quantity:', existingItem);
        } else {
            this.items.push(item);
            console.log('Added new item to cart');
        }
        
        console.log('Current cart items after:', this.items);
        
        this.saveCart();
        this.updateCartDisplay();
        this.showAddedNotification(item.name);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.items.find(cartItem => cartItem.id === itemId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        if (this.outletId) {
            localStorage.setItem('cartOutletId', this.outletId);
        } else {
            localStorage.removeItem('cartOutletId');
        }
        this.emitUpdate();
    }

    updateCartDisplay() {
        console.log('Updating cart display with items:', this.items);
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartTotal();
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    updateCartItems() {
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');
        const checkoutBtn = document.getElementById('checkoutBtn');

        console.log('updateCartItems called with items:', this.items);
        console.log('Cart elements found:', { cartItems: !!cartItems, cartEmpty: !!cartEmpty, cartFooter: !!cartFooter });

        if (!cartItems) {
            console.error('cartItems element not found');
            return;
        }

        if (this.items.length === 0) {
            console.log('Cart is empty, showing empty state');
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = true;
            cartItems.innerHTML = '';
            if (cartEmpty) cartItems.appendChild(cartEmpty);
        } else {
            console.log('Cart has items, rendering cart items');
            if (cartEmpty) cartEmpty.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = false;
            
            cartItems.innerHTML = '';
            this.items.forEach((item, index) => {
                console.log(`Rendering cart item ${index + 1}:`, item);
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                const priceNumber = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-price">₹${priceNumber.toFixed(2)}</p>
                        <div class="cart-item-controls">
                            <button class="quantity-btn decrease" data-item-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-item-id="${item.id}">+</button>
                            <button class="remove-btn" data-item-id="${item.id}">×</button>
                        </div>
                    </div>
                `;
                
                // Add event listeners for the buttons
                const decreaseBtn = cartItem.querySelector('.decrease');
                const increaseBtn = cartItem.querySelector('.increase');
                const removeBtn = cartItem.querySelector('.remove-btn');
                
                decreaseBtn.addEventListener('click', () => {
                    this.updateQuantity(item.id, item.quantity - 1);
                });
                
                increaseBtn.addEventListener('click', () => {
                    this.updateQuantity(item.id, item.quantity + 1);
                });
                
                removeBtn.addEventListener('click', () => {
                    this.removeItem(item.id);
                });
                
                cartItems.appendChild(cartItem);
                console.log('Cart item appended to DOM');
            });
        }
    }

    placeOrder() {
        if (!this.items || this.items.length === 0) return;
        // Backup, then clear cart data
        this.previousItems = this.items.map(item => ({...item}));
        this.items = [];
        this.outletId = null;
        this.saveCart();
        this.updateCartCount();
        this.updateCartTotal();

        // Render confirmation message in sidebar
        const cartItems = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (cartFooter) cartFooter.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (cartItems) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <div class="empty-cart-icon">✅</div>
                    <p>Order placed!</p>
                    <p>Thank you for your order.</p>
                    <button class="checkout-btn" id="backToCartBtn" onclick="cart.restoreCart()">Back to Cart</button>
                </div>
            `;
        }
    }

    restoreCart() {
        if (!this.previousItems || this.previousItems.length === 0) return;
        this.items = this.previousItems.map(item => ({...item}));
        this.saveCart();
        this.updateCartDisplay();
        const cartFooter = document.getElementById('cartFooter');
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (cartFooter) cartFooter.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `₹${total.toFixed(2)}`;
        }
    }

    getTotalAmount() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    emitUpdate() {
        window.dispatchEvent(new CustomEvent('cart:updated', {
            detail: {
                items: this.items.map(item => ({ ...item })),
                total: this.getTotalAmount()
            }
        }));
    }

    toggleCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('cart-open');
            
            // Force refresh cart display when opening
            if (sidebar.classList.contains('active')) {
                console.log('Cart opened, refreshing display');
                this.updateCartDisplay();
            }
        }
    }

    closeCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('cart-open');
        }
    }

    showAddedNotification(itemName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-text">${itemName} added to cart!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all DOM elements are available
    setTimeout(() => {
        console.log('Initializing cart...');
        // Expose cart globally for inline onclick handlers to work
        window.cart = new Cart();
        console.log('Cart initialized with items:', window.cart.items);

    }, 100);
    
    // Use event delegation for dynamically added elements
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = e.target.closest('.product-card, .food-card');
            if (productCard) {
                const nameElement = productCard.querySelector('.product-name, .food-title');
                const priceElement = productCard.querySelector('.product-price, .food-price');
                const imageElement = productCard.querySelector('.product-img, .food-img');
                
                if (nameElement && priceElement && imageElement) {
                    const name = nameElement.textContent.trim();
                    const priceText = priceElement.textContent.trim();
                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                    const image = imageElement.src;
                    
                    console.log('Adding item to cart:', { name, price, image });
                    
                    if (window.cart) {
                        window.cart.addItem({
                            id: Date.now() + Math.random(),
                            name: name,
                            price: isNaN(price) ? 0 : price,
                            image: image,
                            quantity: 1
                        });
                    } else {
                        console.error('Cart not initialized yet');
                    }
                }
            }
        }
    });
});
