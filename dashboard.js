document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (localStorage.getItem('dashboard_logged_in') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  // --- Element Selectors ---
  const grid = document.getElementById('orders-grid');
  const menuForm = document.getElementById('menu-form');
  const menuList = document.getElementById('menu-list');
  const menuNameInput = document.getElementById('menu-name');
  const menuPriceInput = document.getElementById('menu-price');
  const logoutBtn = document.getElementById('logout-btn');
  const welcomeUser = document.getElementById('welcome-user');

  if (!grid) return;

  // --- API URLs ---
  const API_URL = 'http://localhost:3000/api/orders';
  const EXPORT_API_URL = 'http://localhost:3000/api/orders/completed-canceled';
  const MENU_API_URL = 'http://localhost:3000/api/menu';

  // --- Tab Management ---
  const tabButtons = document.querySelectorAll('[data-tab]');
  const sections = {
    orders: document.getElementById('tab-orders'),
    menu: document.getElementById('tab-menu')
  };
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      
      // Remove active class from all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Show/hide sections
      Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
      });
      if (sections[tab]) {
        sections[tab].style.display = 'block';
      }
      // Load content for the selected tab
      if (tab === 'menu') {
        fetchMenuItems();
      }
    });
  });

  // Set first tab as active
  if (tabButtons.length > 0) {
    tabButtons[0].classList.add('active');
  }

  let isLoading = false;

  function showLoading() {
    grid.innerHTML = '<div class="loading-spinner">Loading orders...</div>';
  }

  async function fetchAndRenderOrders() {
    if (isLoading) return;
    isLoading = true;
    
    // Only show the main loading spinner on the first load
    if (grid.innerHTML === '') {
        showLoading();
    }
    
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      const orders = await response.json();
      renderOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      grid.innerHTML = '<p style="color: red; text-align: center;">Could not load orders. Is the server running?</p>';
    } finally {
      isLoading = false;
    }
  }

  function renderOrders(orders) {
    grid.innerHTML = '';
    if (orders.length === 0) {
      grid.innerHTML = '<p style="text-align: center;">No pending orders.</p>';
      return;
    }

    // Group orders by table and creation time (cart orders)
    const cartGroups = {};
    orders.forEach(order => {
      // Group orders placed at the exact same millisecond
      const cartKey = `${order.table || 'Walk-in'}_${order.createdAt}`; 
      if (!cartGroups[cartKey]) {
        cartGroups[cartKey] = {
          table: order.table || 'Walk-in',
          notes: order.notes || '',
          createdAt: order.createdAt,
          orders: []
        };
      }
      cartGroups[cartKey].orders.push(order);
    });

    // Render each cart as a separate box
    Object.values(cartGroups).forEach(cart => {
      const cartCard = document.createElement('div');
      cartCard.className = 'cart-order-card';
      
      const itemsHTML = cart.orders.map(order => `
        <div class="cart-item">
          <span class="item-name">${order.name}</span>
          <span class="item-qty">x${order.qty}</span>
        </div>
      `).join('');

      const notesHTML = cart.notes ? `<div class="cart-notes"><strong>Notes:</strong> ${cart.notes}</div>` : '';
      
      const orderIds = cart.orders.map(order => order._id).join(',');

      cartCard.innerHTML = `
        <div class="cart-header">
          <div class="cart-table">${cart.table === 'Walk-in' ? 'Walk-in' : 'Table ' + cart.table}</div>
          <div class="cart-time">${new Date(cart.createdAt).toLocaleTimeString()}</div>
        </div>
        <div class="cart-items">
          ${itemsHTML}
        </div>
        ${notesHTML}
        <div class="cart-actions">
          <button class="btn-done cart-complete" data-status="completed" data-ids="${orderIds}">✅ Complete All</button>
          <button class="btn-cancel cart-cancel" data-status="canceled" data-ids="${orderIds}">❌ Cancel All</button>
        </div>
      `;
      grid.appendChild(cartCard);
    });
  }

  grid.addEventListener('click', async (e) => {
    const button = e.target.closest('.btn-done, .btn-cancel');
    if (!button) return;

    const card = button.closest('.cart-order-card');
    if (!card) return;
    
    const orderIds = button.dataset.ids;
    const newStatus = button.dataset.status;
    
    if (!orderIds || !newStatus) {
      console.error('Missing order IDs or status');
      return;
    }

    try {
      button.disabled = true;
      button.textContent = 'Updating...';
      
      const orderIdArray = orderIds.split(',');
      const updatePromises = orderIdArray.map(orderId => 
        fetch(`${API_URL}/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      
      const responses = await Promise.all(updatePromises);
      const failedUpdates = responses.filter(response => !response.ok);
      
      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} orders`);
      }
      
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.remove(), 300);
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Could not update orders. Please try again.');
      
      button.disabled = false;
      button.textContent = newStatus === 'completed' ? '✅ Complete All' : '❌ Cancel All';
    }
  });

  // CSV export functionality
  function toCsv(rows) {
    return rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  }
  
  function download(filename, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  
  function formatTime(ts) {
    try { 
      return new Date(ts).toLocaleString(); 
    } catch(_) { 
      return ''; 
    }
  }

  const btnAll = document.getElementById('export-all');
  if (btnAll) {
    btnAll.addEventListener('click', async function() {
      try {
        btnAll.textContent = 'Exporting...';
        btnAll.disabled = true;
        
        const response = await fetch(EXPORT_API_URL);
        if (!response.ok) throw new Error('Failed to fetch completed/canceled orders');
        const orders = await response.json();
        
        const header = ['Name', 'Qty', 'Status', 'Table', 'Notes', 'Ordered At', 'Completed/Canceled At'];
        const rows = orders.map(o => [
          o.name || '', 
          o.qty || 1, 
          o.status || '', 
          o.table || 'Walk-in',
          o.notes || '',
          formatTime(o.createdAt), 
          formatTime(o.updatedAt)
        ]);
        
        download('orders_completed_canceled.csv', toCsv([header].concat(rows)));
      } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Could not export CSV. Is the server running?');
      } finally {
        btnAll.textContent = 'Export Completed + Canceled (CSV)';
        btnAll.disabled = false;
      }
    });
  }

  // --- Menu Management ---
  async function fetchMenuItems() {
    if (!menuList) return;
    
    // Show loading state
    menuList.innerHTML = '<div class="loading-spinner">Loading menu items...</div>';
    
    try {
      console.log('Fetching menu from:', MENU_API_URL);
      const response = await fetch(MENU_API_URL);
      console.log('Menu API response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const items = await response.json();
      console.log('Menu items received:', items);
      renderMenu(items);
    } catch (error) {
      console.error('Error fetching menu:', error);
      if (menuList) {
        // Check if it's a JSON parsing error (HTML response)
        if (error.message.includes('Unexpected token') || error.message.includes('<!DOCTYPE')) {
          console.log('Server returned HTML instead of JSON - using fallback menu items');
        } else {
          console.log('Network or server error - using fallback menu items');
        }
        
        // Show fallback menu items when server is down
        renderMenu(fallbackMenuItems);
        
        // Add a notice about using fallback data
        const notice = document.createElement('div');
        notice.style.cssText = 'text-align: center; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin-bottom: 10px; color: #856404;';
        notice.innerHTML = `
          <strong>⚠️ Offline Mode:</strong> Showing sample menu items. Server may be down or not responding properly.
          <button onclick="fetchMenuItems()" class="btn-chip" style="margin-left: 10px; font-size: 12px;">Retry Connection</button>
        `;
        menuList.insertBefore(notice, menuList.firstChild);
      }
    }
  }

  async function addMenuItem(name, price) {
    try {
      console.log('Adding menu item:', { name, price });
      console.log('POST URL:', MENU_API_URL);
      
      const response = await fetch(MENU_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (contentType && contentType.includes('text/html')) {
          const htmlContent = await response.text();
          console.log('HTML response:', htmlContent.substring(0, 200));
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Server may be down or endpoint not found.`);
        }
        
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error! status: ${response.status}. Response is not valid JSON.`);
        }
      }
      
      const result = await response.json();
      console.log('Successfully added item:', result);
      
      fetchMenuItems(); // Refresh the list
      if (menuForm) menuForm.reset();
    } catch (error) {
      console.error('Error adding menu item:', error);
      alert(`Failed to add item: ${error.message}`);
    }
  }

  async function deleteMenuItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${MENU_API_URL}/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Server may be down or endpoint not found.`);
        }
        
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error! status: ${response.status}. Response is not valid JSON.`);
        }
      }
      
      fetchMenuItems(); // Refresh the list
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert(`Failed to delete item: ${error.message}`);
    }
  }

  function renderMenu(items) {
    if (!menuList) return;
    menuList.innerHTML = '';
    if (items.length === 0) {
      menuList.innerHTML = '<p style="text-align:center;">No menu items yet. Add one above.</p>';
      return;
    }
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cart-order-card';
      
      // Check if this is a fallback item (read-only)
      const isFallback = item._id && item._id.startsWith('fallback');
      
      card.innerHTML = `
        <div class="cart-header">
          <div class="cart-table">${item.name}</div>
          <div class="cart-time">${item.price} DA</div>
        </div>
        ${item.description ? `<div style="padding: 8px 0; color: #666; font-size: 14px;">${item.description}</div>` : ''}
        <div class="cart-actions">
          ${isFallback ? 
            '<button class="btn-cancel" disabled style="opacity: 0.5;">Sample Item</button>' : 
            `<button class="btn-cancel" data-id="${item._id}">Delete</button>`
          }
        </div>
      `;
      menuList.appendChild(card);
    });
  }

  // Menu form submission
  if (menuForm) {
    menuForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = menuNameInput ? menuNameInput.value.trim() : '';
      const price = menuPriceInput ? parseFloat(menuPriceInput.value) : 0;
      if (name && !isNaN(price)) {
        addMenuItem(name, price);
      }
    });
  }

  // Menu list click handler
  if (menuList) {
    menuList.addEventListener('click', (e) => {
      const deleteButton = e.target.closest('button[data-id]');
      if (deleteButton) {
        deleteMenuItem(deleteButton.dataset.id);
      }
    });
  }

  // --- Logout Functionality ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('dashboard_logged_in');
      localStorage.removeItem('dashboard_user');
      window.location.href = 'login.html';
    });
  }

  // Set welcome user
  if (welcomeUser) {
    const user = localStorage.getItem('dashboard_user') || 'Admin';
    welcomeUser.textContent = `Welcome, ${user}`;
  }

  // --- Fallback menu items for when server is down ---
  const fallbackMenuItems = [
    { _id: 'fallback1', name: 'Espresso', price: 150, description: 'Rich and bold coffee' },
    { _id: 'fallback2', name: 'Latte', price: 200, description: 'Smooth espresso with steamed milk' },
    { _id: 'fallback3', name: 'Cappuccino', price: 180, description: 'Espresso with equal parts milk and foam' },
    { _id: 'fallback4', name: 'Americano', price: 120, description: 'Espresso with hot water' },
    { _id: 'fallback5', name: 'Mocha', price: 220, description: 'Espresso with chocolate and steamed milk' },
    { _id: 'fallback6', name: 'Iced Coffee', price: 160, description: 'Cold brewed coffee over ice' }
  ];

  // --- Initialize with sample menu items if empty ---
  async function initializeMenu() {
    try {
      const response = await fetch(MENU_API_URL);
      if (response.ok) {
        const items = await response.json();
        if (items.length === 0) {
          // Add some sample menu items
          const sampleItems = [
            { name: 'Espresso', price: 150, description: 'Rich and bold coffee' },
            { name: 'Latte', price: 200, description: 'Smooth espresso with steamed milk' },
            { name: 'Cappuccino', price: 180, description: 'Espresso with equal parts milk and foam' },
            { name: 'Americano', price: 120, description: 'Espresso with hot water' },
            { name: 'Mocha', price: 220, description: 'Espresso with chocolate and steamed milk' },
            { name: 'Iced Coffee', price: 160, description: 'Cold brewed coffee over ice' }
          ];
          
          for (const item of sampleItems) {
            await fetch(MENU_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          }
          console.log('Sample menu items added successfully');
        }
      }
    } catch (error) {
      console.log('Could not initialize menu items:', error);
    }
  }

  // Initialize menu on page load
  initializeMenu();

  fetchAndRenderOrders();
  setInterval(fetchAndRenderOrders, 5000); // Check for new orders every 5 seconds
});