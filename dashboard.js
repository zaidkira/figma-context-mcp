document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('orders-grid');
  if (!grid) return;

  const API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders';
  const EXPORT_API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders/completed-canceled';

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

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.dataset.id = order._id;

      // Add a section for notes if they exist
      const notesHTML = order.notes ? `<div class="notes"><strong>Notes:</strong> ${order.notes}</div>` : '';

      card.innerHTML = `
        <div class="table">${order.table ? 'Table ' + order.table : 'Walk-in'}</div>
        <div class="item">${order.name}</div>
        <div class="qty1">x${order.qty}</div>
        ${notesHTML}
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
      // CORRECTED: Use a cleaner way to build the URL for the update
      await fetch(`${API_URL}/${orderId}`, {
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