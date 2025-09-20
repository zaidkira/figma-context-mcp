document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
  
    // --- New Menu Rendering Logic ---
    const MENU_API_URL = 'http://localhost:3000/api/menu';
    const cardGrid = document.querySelector('.card-grid');
  
    async function fetchAndRenderMenu() {
        try {
            cardGrid.innerHTML = '<p>Loading menu...</p>'; // Show a loading message
            const response = await fetch(MENU_API_URL);
            if (!response.ok) throw new Error('Failed to fetch menu');
            const menuItems = await response.json();
  
            cardGrid.innerHTML = ''; // Clear the loading message
            if (menuItems.length === 0) {
                 cardGrid.innerHTML = '<p>Menu is currently unavailable.</p>';
                 return;
            }
  
            menuItems.forEach(item => {
                const card = document.createElement('article');
                card.className = 'card';
                card.dataset.id = item._id; // Use the database ID
                card.dataset.price = item.price;
  
                card.innerHTML = `
                    <img src="${item.imageUrl || 'assets/images/card-latte.png'}" alt="${item.name}">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-sub">${item.description}</p>
                    <div class="card-cta">
                        <span class="price">${item.price} DA</span>
                        <button class="btn-chip btn-add-to-cart">Add to Cart</button>
                    </div>
                `;
                cardGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching menu:', error);
            cardGrid.innerHTML = '<p style="color: red;">Could not load the menu.</p>';
        }
    }
  
  
    // --- Element Selectors ---
    const cartBtn = document.getElementById('cart-fab-btn');
    const cartCountSpan = document.getElementById('cart-fab-count');
    const cartModal = document.getElementById('cart-modal');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const placeOrderBtn = document.getElementById('place-order-btn');
    // Get table number from URL parameter or default to 'Walk-in'
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table') || 'Walk-in';
    
    // --- Core Functions ---
    const openCart = () => {
        renderCart();
        cartModal.classList.add('active');
        cartOverlay.classList.add('active');
    };
  
    const closeCart = () => {
        cartModal.classList.remove('active');
        cartOverlay.classList.remove('active');
    };
  
    const addToCart = (item) => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ ...item, qty: 1 });
        }
        showToast(`✅ ${item.name} added to cart!`);
        updateCart();
    };
    
    const updateCartItemQuantity = (itemId, newQty) => {
        const itemIndex = cart.findIndex(cartItem => cartItem.id === itemId);
        if (itemIndex !== -1) {
            if (newQty <= 0) {
                cart.splice(itemIndex, 1);
            } else {
                cart[itemIndex].qty = newQty;
            }
        }
        updateCart();
    };
  
    const updateCart = () => {
        renderCart();
        updateCartCount();
    };
  
    const renderCart = () => {
        cartItemsList.innerHTML = '';
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <span class="cart-item-name">${item.name}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="cart-item-qty">${item.qty}</span>
                        <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
                        <span class="cart-item-price">${item.price * item.qty} DA</span>
                    </div>
                `;
                cartItemsList.appendChild(itemElement);
            });
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        cartTotalPriceSpan.textContent = `${total} DA`;
    };
  
    const updateCartCount = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCountSpan.textContent = totalItems;
    };
    
    const showToast = (msg, isError = false) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (isError) toast.style.backgroundColor = '#9E1C08';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };
  
    // --- Event Listeners ---
    cardGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-to-cart')) {
            const card = e.target.closest('.card');
            const item = {
                id: card.dataset.id,
                name: card.querySelector('.card-title').textContent,
                price: parseFloat(card.dataset.price)
            };
            addToCart(item);
        }
    });
  
    cartBtn.addEventListener('click', openCart);
    cartCloseBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
  
    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('qty-btn')) {
            const id = e.target.dataset.id;
            const action = e.target.dataset.action;
            const item = cart.find(cartItem => cartItem.id === id);
            if (item) {
                const newQty = action === 'increase' ? item.qty + 1 : item.qty - 1;
                updateCartItemQuantity(id, newQty);
            }
        }
    });
  
    placeOrderBtn.addEventListener('click', async () => {
        if (cart.length === 0) {
            showToast("Your cart is empty.", true);
            return;
        }
  
        const orderData = {
            table: tableNumber,
            notes: '',
            items: cart.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price
            }))
        };
  
        try {
            placeOrderBtn.textContent = 'Sending...';
            placeOrderBtn.disabled = true;
  
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${errorData.message || response.statusText}`);
            }
  
            showToast("✅ All orders placed successfully!");
            cart = []; // Empty the cart
            updateCart();
            closeCart();
  
        } catch (error) {
            console.error('Failed to place order:', error);
            showToast("❌ Failed to place order. Please try again.", true);
        } finally {
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
        }
    });
  
    fetchAndRenderMenu();

    // --- Mobile Navigation ---
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const headerActions = document.getElementById('header-actions');
    const navOverlay = document.getElementById('nav-overlay');

    if (navToggle && navMenu && headerActions && navOverlay) {
        // Toggle mobile navigation
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            headerActions.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile navigation when clicking overlay
        navOverlay.addEventListener('click', () => {
            navMenu.classList.remove('active');
            headerActions.classList.remove('active');
            navToggle.classList.remove('active');
        });

        // Close mobile navigation when clicking menu links
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                headerActions.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
  });