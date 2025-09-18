document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('orders-grid');
  if (!grid) return;

  // Use the correct live URL for your Render server
  const API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders';
  
  // Loading state management
  let isLoading = false;

  function showLoading() {
    grid.innerHTML = '<div class="loading-spinner">Loading orders...</div>';
  }

  async function fetchAndRenderOrders() {
    if (isLoading) return;
    isLoading = true;
    showLoading();
    
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

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.dataset.id = order._id;

      card.innerHTML = `
        <div class="table">${order.table ? 'Table ' + order.table : 'Walk-in'}</div>
        <div class="item">${order.name}</div>
        <div class="qty1">x${order.qty}</div>
        <div class="actions">
          <button class="btn-done" data-status="completed">✅ Completed</button>
          <button class="btn-cancel" data-status="canceled">❌ Cancel</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  grid.addEventListener('click', async (e) => {
    const button = e.target.closest('.btn-done, .btn-cancel');
    if (!button) return;

    const card = button.closest('.order-card');
    const orderId = card.dataset.id;
    const newStatus = button.dataset.status;

    try {
      // Note: We are now sending updates to a specific order ID
      await fetch(`${API_URL.replace('/api/orders', '/api/orders/')}${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 300);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Could not update order.');
    }
  });

  // CSV export functionality
  function toCsv(rows) {
    return rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
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

  // Export button functionality
  const btnAll = document.getElementById('export-all');
  if (btnAll) {
    btnAll.addEventListener('click', async function() {
      try {
        btnAll.textContent = 'Exporting...';
        btnAll.disabled = true;
        
        const response = await fetch(`${API_URL}/completed-canceled`);
        if (!response.ok) throw new Error('Failed to fetch');
        const orders = await response.json();
        
        const header = ['Name','Qty','Status','Table','Ordered At','Completed/Canceled At'];
        const rows = orders.map(o => [
          o.name || '', 
          o.qty || 1, 
          o.status || '', 
          o.table || 'Walk-in',
          formatTime(o.createdAt), 
          formatTime(o.completedAt || o.updatedAt)
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
  setInterval(fetchAndRenderOrders, 3000);
});