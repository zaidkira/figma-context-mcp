document.addEventListener('DOMContentLoaded', () => {
  let cart = [];

  // --- Element Selectors ---
  const cartBtn = document.getElementById('cart-btn');
  const cartFab = document.getElementById('cart-fab');
  const cartFabCount = document.getElementById('cart-fab-count');
  const cartCountSpan = document.getElementById('cart-count');
  const cartModal = document.getElementById('cart-modal');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsList = document.getElementById('cart-items');
  const cartTotalPriceSpan = document.getElementById('cart-total-price');
  const placeOrderBtn = document.getElementById('place-order-btn');
  // Mobile nav
  const navToggle = document.getElementById('nav-toggle');
  const siteMenu = document.getElementById('site-menu');
  const headerActions = document.getElementById('header-actions');
  const navOverlay = document.getElementById('nav-overlay');
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
      if (cartFabCount) cartFabCount.textContent = totalItems;
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
  // Mobile nav toggle
  if (navToggle && siteMenu && headerActions) {
      navToggle.addEventListener('click', () => {
          const expanded = navToggle.getAttribute('aria-expanded') === 'true';
          navToggle.setAttribute('aria-expanded', String(!expanded));
          siteMenu.classList.toggle('active');
          headerActions.classList.toggle('active');
          // overlay no longer used
      });

      // Close menu after clicking a menu link and scroll
      siteMenu.addEventListener('click', (e) => {
          const link = e.target.closest('a[href^="#"]');
          if (!link) return;
          const targetId = link.getAttribute('href');
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          navToggle.setAttribute('aria-expanded', 'false');
          siteMenu.classList.remove('active');
          headerActions.classList.remove('active');
          // overlay no longer used
      });
  }

  // Close menu when overlay clicked or link tapped
  if (navOverlay) {
      navOverlay.addEventListener('click', () => {
          navToggle.setAttribute('aria-expanded', 'false');
          siteMenu.classList.remove('active');
          headerActions.classList.remove('active');
          navOverlay.classList.remove('active');
      });
  }
  document.querySelectorAll('#site-menu a').forEach(a => {
      a.addEventListener('click', () => {
          if (!navToggle) return;
          navToggle.setAttribute('aria-expanded', 'false');
          siteMenu.classList.remove('active');
          headerActions.classList.remove('active');
          if (navOverlay) navOverlay.classList.remove('active');
      });
  });

  document.querySelectorAll('.btn-add-to-cart').forEach(button => {
      button.addEventListener('click', (e) => {
          const card = e.target.closest('.card');
          const item = {
              id: card.dataset.id,
              name: card.querySelector('.card-title').textContent,
              price: parseFloat(card.dataset.price)
          };
          addToCart(item);
      });
  });

  cartBtn.addEventListener('click', openCart);
  if (cartFab) cartFab.addEventListener('click', openCart);
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

  // NEW: Event listener for the final "Place Order" button
  placeOrderBtn.addEventListener('click', async () => {
      if (cart.length === 0) {
          showToast("Your cart is empty.", true);
          return;
      }

      // Create order data in the format the server expects
      const orderData = {
          table: tableNumber,
          notes: '',
          items: cart.map(item => ({
              name: item.name,
              qty: item.qty
          }))
      };

      try {
          placeOrderBtn.textContent = 'Sending...';
          placeOrderBtn.disabled = true;

          // Send the order to the server
          const response = await fetch('https://coffee-shop-backend-00m8.onrender.com/api/orders', {
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
});