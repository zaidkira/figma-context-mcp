document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
  
    // --- Activation Key System ---
    const ACTIVATION_KEY = 'COFFEE2024'; // Change this to your desired key
    const ACTIVATION_STORAGE_KEY = 'coffee_app_activation';
    
    function checkActivation() {
      console.log('🔍 Checking activation...');
      const activationData = localStorage.getItem(ACTIVATION_STORAGE_KEY);
      console.log('Activation data:', activationData);
      
      if (!activationData) {
        console.log('❌ No activation data found, showing modal');
        showActivationModal();
        return false;
      }
      
      try {
        const { key, activatedAt } = JSON.parse(activationData);
        const now = new Date();
        const activationDate = new Date(activatedAt);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        console.log('Key:', key, 'Expected:', ACTIVATION_KEY);
        console.log('Activation date:', activationDate);
        console.log('One month ago:', oneMonthAgo);
        console.log('Is expired?', activationDate < oneMonthAgo);
        
        if (key !== ACTIVATION_KEY || activationDate < oneMonthAgo) {
          console.log('❌ Activation expired or invalid, showing modal');
          showActivationModal();
          return false;
        }
        
        console.log('✅ Activation valid');
        return true;
      } catch (error) {
        console.log('❌ Error parsing activation data:', error);
        showActivationModal();
        return false;
      }
    }
    
    function showActivationModal() {
      console.log('🔑 Showing activation modal...');
      const activationModal = document.getElementById('activation-modal');
      const activationOverlay = document.getElementById('activation-overlay');
      
      console.log('Modal element:', activationModal);
      console.log('Overlay element:', activationOverlay);
      
      if (activationModal && activationOverlay) {
        activationModal.classList.add('active');
        activationOverlay.classList.add('active');
        
        // Disable all app functionality
        document.body.style.pointerEvents = 'none';
        activationModal.style.pointerEvents = 'auto';
        console.log('✅ Modal shown successfully');
      } else {
        console.error('❌ Modal elements not found!');
      }
    }
    
    function hideActivationModal() {
      const activationModal = document.getElementById('activation-modal');
      const activationOverlay = document.getElementById('activation-overlay');
      activationModal.classList.remove('active');
      activationOverlay.classList.remove('active');
      
      // Re-enable app functionality
      document.body.style.pointerEvents = 'auto';
      
      // Add a floating activation button for easy access
      addFloatingActivationButton();
    }
    
    function addFloatingActivationButton() {
      // Remove existing button if any
      const existingBtn = document.getElementById('floating-activation-btn');
      if (existingBtn) existingBtn.remove();
      
      // Create floating activation button
      const floatingBtn = document.createElement('button');
      floatingBtn.id = 'floating-activation-btn';
      floatingBtn.innerHTML = '🔑 Activate';
      floatingBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      
      floatingBtn.addEventListener('click', () => {
        showActivationModal();
        floatingBtn.remove();
      });
      
      document.body.appendChild(floatingBtn);
    }
    
    function activateApp(key) {
      if (key === ACTIVATION_KEY) {
        const activationData = {
          key: key,
          activatedAt: new Date().toISOString()
        };
        localStorage.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(activationData));
        hideActivationModal();
        alert('✅ App activated successfully!');
        return true;
      } else {
        alert('❌ Invalid activation key');
        return false;
      }
    }
    
    // --- Activation Modal Event Listeners (must be set up before activation check) ---
    const activationKeyInput = document.getElementById('activation-key-input');
    const activateBtn = document.getElementById('activate-btn');
    const activationCancelBtn = document.getElementById('activation-cancel-btn');
    const activationOverlay = document.getElementById('activation-overlay');
    
    console.log('Setting up activation event listeners...');
    console.log('Activate button:', activateBtn);
    console.log('Activation input:', activationKeyInput);
    
    if (activateBtn) {
      activateBtn.addEventListener('click', () => {
        console.log('Activate button clicked!');
        const key = activationKeyInput ? activationKeyInput.value.trim() : '';
        console.log('Entered key:', key);
        if (key) {
          activateApp(key);
        } else {
          alert('❌ Please enter an activation key');
        }
      });
    } else {
      console.error('❌ Activate button not found!');
    }
    
    if (activationCancelBtn) {
      activationCancelBtn.addEventListener('click', () => {
        // Hide modal but show floating button for re-activation
        hideActivationModal();
        alert('App requires activation. Click the "🔑 Activate" button to continue.');
      });
    }
    
    if (activationOverlay) {
      activationOverlay.addEventListener('click', () => {
        // Prevent closing by clicking overlay - force activation
        alert('Please enter activation key to continue');
      });
    }
    
    if (activationKeyInput) {
      activationKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('Enter key pressed!');
          const key = activationKeyInput.value.trim();
          if (key) {
            activateApp(key);
          }
        }
      });
    }

    // Check activation on page load
    if (!checkActivation()) {
      return; // Stop execution if not activated
    }
    
    // Check activation every hour to catch expiry
    setInterval(() => {
      console.log('⏰ Checking activation expiry...');
      if (!checkActivation()) {
        console.log('🔒 App locked due to activation expiry');
        // Stop all app functionality
        document.body.style.pointerEvents = 'none';
        // Show modal
        showActivationModal();
      }
    }, 3600000); // Check every hour (3600000 ms)
    
    // Show countdown timer
    function updateCountdown() {
      const activationData = localStorage.getItem(ACTIVATION_STORAGE_KEY);
      if (activationData) {
        try {
          const { activatedAt } = JSON.parse(activationData);
          const now = new Date();
          const activationDate = new Date(activatedAt);
          const expiryTime = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, activationDate.getDate()); // 1 month from activation
          const timeLeft = expiryTime - now;
          
          if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            console.log(`⏱️ Activation expires in: ${days} days, ${hours} hours`);
          }
        } catch (error) {
          console.log('Error calculating countdown:', error);
        }
      }
    }
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
  
    // --- API base resolution (supports Netlify static + separate backend) ---
    const urlApiBase = new URLSearchParams(location.search).get('api_base') || '';
    if (urlApiBase) {
        try { localStorage.setItem('api_base', urlApiBase); } catch(_) {}
    }
    const storedBase = (typeof localStorage !== 'undefined') ? (localStorage.getItem('api_base') || '') : '';
    const inferredLocalBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '';
    const rawBase = (window.API_BASE || urlApiBase || storedBase || inferredLocalBase).replace(/\/$/, '');
    const isHttp = /^https?:\/\//i.test(rawBase) || rawBase === '';
    const API_BASE = isHttp ? rawBase : '';
    const MENU_API_URL = API_BASE ? `${API_BASE}/api/menu` : '/api/menu';
    const cardGrid = document.querySelector('.card-grid');
    const categoryFilters = document.getElementById('category-filters');
    let currentCategoryFilter = 'All';
  
    // Fallback menu items for offline mode
    const fallbackMenuItems = [
        { _id: 'fallback1', name: 'Espresso', price: 150, description: 'Rich and bold coffee', imageUrl: 'assets/images/card-espresso.png' },
        { _id: 'fallback2', name: 'Latte', price: 200, description: 'Smooth espresso with steamed milk', imageUrl: 'assets/images/card-latte.png' },
        { _id: 'fallback3', name: 'Cappuccino', price: 180, description: 'Espresso with equal parts milk and foam', imageUrl: 'assets/images/card-cappuccino.png' },
        { _id: 'fallback4', name: 'Americano', price: 120, description: 'Espresso with hot water', imageUrl: 'assets/images/card-drip-1078a0.png' },
        { _id: 'fallback5', name: 'Mocha', price: 220, description: 'Espresso with chocolate and steamed milk', imageUrl: 'assets/images/card-mocha.png' },
        { _id: 'fallback6', name: 'Iced Tea', price: 160, description: 'Refreshing iced tea', imageUrl: 'assets/images/card-iced-tea-5141e6.png' }
    ];

    function renderMenu(items) {
        cardGrid.innerHTML = '';
        if (!items || items.length === 0) {
            cardGrid.innerHTML = '<p>Menu is currently unavailable.</p>';
            return;
        }
        // Group items by category
        const categoryToItems = items.reduce((acc, item) => {
            const cat = (item.category && String(item.category).trim()) || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        const categories = Object.keys(categoryToItems).sort((a, b) => a.localeCompare(b));

        // Render filter chips
        if (categoryFilters) {
            const allCategories = ['All'].concat(categories);
            categoryFilters.innerHTML = '';
            allCategories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'btn-chip';
                btn.textContent = cat;
                if (cat === currentCategoryFilter) btn.classList.add('active');
                btn.addEventListener('click', () => {
                    currentCategoryFilter = cat;
                    // Re-render menu filtered
                    renderFiltered();
                });
                categoryFilters.appendChild(btn);
            });
        }

        function renderFiltered() {
            cardGrid.innerHTML = '';
            const visibleCategories = currentCategoryFilter === 'All' ? categories : categories.filter(c => c === currentCategoryFilter);
            visibleCategories.forEach(category => {
                // Category heading
                const heading = document.createElement('h3');
                heading.textContent = category;
                heading.style.cssText = 'grid-column: 1 / -1; margin: 8px 0 4px; color:#333; font-size:18px;';
                cardGrid.appendChild(heading);
                // Cards
                categoryToItems[category].forEach(item => {
                    const card = document.createElement('article');
                    card.className = 'card';
                    card.dataset.id = item._id || item.id || `fallback_${item.name}`;
                    card.dataset.price = item.price;
                    card.dataset.category = (item.category && String(item.category).trim()) || 'Other';
                    card.innerHTML = `
                        <img src="${item.imageUrl || 'assets/images/card-latte.png'}" alt="${item.name}">
                        <h3 class="card-title">${item.name}</h3>
                        ${item.description ? `<p class="card-sub">${item.description}</p>` : ''}
                        <div class="card-cta">
                            <span class="price">${item.price} DA</span>
                            <button class="btn-chip btn-add-to-cart">Add to Cart</button>
                        </div>
                    `;
                    cardGrid.appendChild(card);
                });
            });
        }

        // Initial render
        renderFiltered();
    }

    async function fetchAndRenderMenu() {
        try {
            console.log('Fetching menu from:', MENU_API_URL);
            cardGrid.innerHTML = '<p>Loading menu...</p>'; // Show a loading message
            const response = await fetch(MENU_API_URL);
            console.log('Menu response status:', response.status, response.statusText);
            if (!response.ok) throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`);
            const menuItems = await response.json();
            console.log('Menu items received:', menuItems);
            renderMenu(menuItems);
        } catch (error) {
            console.error('Error fetching menu:', error);
            // If no API base configured (common on Netlify), prompt once
            if (!API_BASE) {
                const input = prompt('Enter backend API base URL (e.g., https://your-backend.example.com)');
                if (input) {
                    try {
                        localStorage.setItem('api_base', input.replace(/\/$/, ''));
                        location.reload();
                        return;
                    } catch(_) {}
                }
            }
            const hint = (!isHttp && rawBase) ? `Invalid API base (must start with http/https): ${rawBase}` : `API base: ${API_BASE || '(not set)'}`;
            cardGrid.innerHTML = `<p style="color: red;">Could not load the menu. Error: ${error.message}.<br/>${hint}<br/>Set window.API_BASE or localStorage 'api_base' to your backend URL.</p>`;
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
            const categoryToItems = cart.reduce((acc, item) => {
                const cat = (item.category && String(item.category).trim()) || 'Other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {});
            const categories = Object.keys(categoryToItems).sort((a, b) => a.localeCompare(b));
            categories.forEach(category => {
                const heading = document.createElement('div');
                heading.textContent = category;
                heading.style.cssText = 'font-weight:600;margin:8px 0;color:#333;';
                cartItemsList.appendChild(heading);
                categoryToItems[category].forEach(item => {
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
  
            const response = await fetch(`${API_BASE || ''}/api/orders`, {
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