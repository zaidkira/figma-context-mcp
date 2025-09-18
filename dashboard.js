document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('orders-grid');
  if (!grid) return;

  const API_URL = 'http://localhost:3000/api/orders';

  // Function to fetch and display orders
  async function fetchAndRenderOrders() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      const orders = await response.json();
      renderOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      grid.innerHTML = '<p style="color: red; text-align: center;">Could not load orders. Is the server running?</p>';
    }
  }

  // Function to render the order cards
  function renderOrders(orders) {
    grid.innerHTML = ''; // Clear existing orders
    if (orders.length === 0) {
      grid.innerHTML = '<p style="text-align: center;">No pending orders.</p>';
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.dataset.id = order._id; // Use MongoDB's _id

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

  // Event listener for the whole grid (for "Completed" and "Cancel" buttons)
  grid.addEventListener('click', async (e) => {
    const button = e.target.closest('.btn-done, .btn-cancel');
    if (!button) return;

    const card = button.closest('.order-card');
    const orderId = card.dataset.id;
    const newStatus = button.dataset.status;

    try {
      await fetch(`${API_URL}/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      // Remove the card from the UI immediately for a faster feel
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
        const response = await fetch(`${API_URL}/completed-canceled`);
        if (!response.ok) throw new Error('Failed to fetch');
        const orders = await response.json();
        
        const header = ['Name','Qty','Status','Ordered At','Completed/Canceled At'];
        const rows = orders.map(o => [
          o.name || '', 
          o.qty || 1, 
          o.status || '', 
          formatTime(o.createdAt), 
          formatTime(o.completedAt || o.updatedAt)
        ]);
        
        download('orders_completed_canceled.csv', toCsv([header].concat(rows)));
      } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Could not export CSV. Is the server running?');
      }
    });
  }

  // Initial load and then refresh every 3 seconds
  fetchAndRenderOrders();
  setInterval(fetchAndRenderOrders, 3000); // Auto-refresh
});