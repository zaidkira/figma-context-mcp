document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (localStorage.getItem('dashboard_logged_in') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  // Update welcome message
  const user = localStorage.getItem('dashboard_user') || 'Admin';
  const welcomeUser = document.getElementById('welcome-user');
  if (welcomeUser) {
    welcomeUser.textContent = `Welcome, ${user}`;
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('dashboard_logged_in');
      localStorage.removeItem('dashboard_user');
      window.location.href = 'login.html';
    });
  }

  const grid = document.getElementById('orders-grid');
  // Tabs setup
  const tabButtons = document.querySelectorAll('[data-tab]');
  const sections = {
    orders: document.getElementById('tab-orders'),
    menu: document.getElementById('tab-menu')
  };
  tabButtons.forEach(btn => btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    Object.entries(sections).forEach(([key, el]) => {
      if (!el) return;
      el.style.display = key === tab ? 'block' : 'none';
    });
  }));

  const API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders';
  const EXPORT_API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders/completed-canceled';
  // Local storage keys for simple CRUD (can be swapped to real API later)
  const MENU_KEY = 'dashboard_menu_items';

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
      const cartKey = `${order.table || 'Walk-in'}_${new Date(order.createdAt).toISOString().split('T')[0]}_${Math.floor(new Date(order.createdAt).getTime() / (5 * 60 * 1000))}`; // Group by 5-minute windows
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
      
      // Sort orders by creation time
      cart.orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
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
  // Menu management (localStorage-backed)
  const menuForm = document.getElementById('menu-form');
  const menuList = document.getElementById('menu-list');
  function loadMenu() {
    try { return JSON.parse(localStorage.getItem(MENU_KEY)) || []; } catch { return []; }
  }
  function saveMenu(items) {
    localStorage.setItem(MENU_KEY, JSON.stringify(items));
  }
  function renderMenu() {
    if (!menuList) return;
    const items = loadMenu();
    menuList.innerHTML = '';
    if (items.length === 0) {
      menuList.innerHTML = '<p style="text-align:center;width:100%;">No menu items yet.</p>';
      return;
    }
    items.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'cart-order-card';
      card.innerHTML = `
        <div class="cart-header">
          <div class="cart-table">${it.name}</div>
          <div class="cart-time">${Number(it.price)} DA</div>
        </div>
        <div class="cart-actions">
          <button class="btn-done" data-action="edit" data-index="${idx}">Edit</button>
          <button class="btn-cancel" data-action="delete" data-index="${idx}">Delete</button>
        </div>
      `;
      menuList.appendChild(card);
    });
  }
  if (menuForm) {
    menuForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('menu-name').value.trim();
      const price = parseFloat(document.getElementById('menu-price').value);
      if (!name || isNaN(price)) return;
      const items = loadMenu();
      const existingIdx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) items[existingIdx] = { name, price };
      else items.push({ name, price });
      saveMenu(items);
      renderMenu();
      menuForm.reset();
    });
    if (menuList) menuList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index, 10);
      const items = loadMenu();
      if (btn.dataset.action === 'delete') {
        items.splice(idx, 1);
        saveMenu(items);
        renderMenu();
      } else if (btn.dataset.action === 'edit') {
        const item = items[idx];
        document.getElementById('menu-name').value = item.name;
        document.getElementById('menu-price').value = item.price;
      }
    });
  }

  // Removed inventory management per request

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
      // Disable button during update
      button.disabled = true;
      button.textContent = 'Updating...';
      
      // Update all orders in the cart
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
      
      // Success - animate card removal
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.remove(), 300);
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Could not update orders. Please try again.');
      
      // Reset button state
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

  fetchAndRenderOrders();
  setInterval(fetchAndRenderOrders, 5000); // Check for new orders every 5 seconds
});