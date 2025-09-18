document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://coffee-shop-backend-00m8.onrender.com/api/orders';
  
  async function fetchAnalytics() {
    try {
      const response = await fetch(`${API_URL}/all`);
      if (!response.ok) throw new Error('Failed to fetch');
      const orders = await response.json();
      
      updateStats(orders);
      updatePopularItems(orders);
      updateRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      document.getElementById('popular-items').innerHTML = '<p style="color: red; text-align: center;">Could not load analytics</p>';
      document.getElementById('recent-orders').innerHTML = '<p style="color: red; text-align: center;">Could not load recent orders</p>';
    }
  }
  
  function updateStats(orders) {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const canceled = orders.filter(o => o.status === 'canceled').length;
    
    document.getElementById('total-orders').textContent = total;
    document.getElementById('completed-orders').textContent = completed;
    document.getElementById('pending-orders').textContent = pending;
    document.getElementById('canceled-orders').textContent = canceled;
  }
  
  function updatePopularItems(orders) {
    const itemCounts = {};
    orders.forEach(order => {
      if (order.status === 'completed') {
        itemCounts[order.name] = (itemCounts[order.name] || 0) + order.qty;
      }
    });
    
    const sortedItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    const container = document.getElementById('popular-items');
    if (sortedItems.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No completed orders yet</p>';
      return;
    }
    
    container.innerHTML = sortedItems.map(([name, count]) => `
      <div class="item-row">
        <span class="item-name">${name}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');
  }
  
  function updateRecentOrders(orders) {
    const recent = orders.slice(0, 10);
    const container = document.getElementById('recent-orders');
    
    if (recent.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No orders yet</p>';
      return;
    }
    
    container.innerHTML = recent.map(order => `
      <div class="item-row">
        <div>
          <span class="item-name">${order.name}</span>
          <span style="color: #666; margin-left: 10px;">x${order.qty}</span>
          <span style="color: #666; margin-left: 10px;">${order.table || 'Walk-in'}</span>
        </div>
        <div>
          <span class="item-count" style="background: ${getStatusColor(order.status)}">${order.status}</span>
          <span style="color: #666; margin-left: 10px; font-size: 12px;">${formatTime(order.createdAt)}</span>
        </div>
      </div>
    `).join('');
  }
  
  function getStatusColor(status) {
    switch(status) {
      case 'completed': return '#0F7932';
      case 'pending': return '#FFA500';
      case 'canceled': return '#9E1C08';
      default: return '#666';
    }
  }
  
  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch(_) {
      return '';
    }
  }
  
  // Initial load and refresh every 30 seconds
  fetchAnalytics();
  setInterval(fetchAnalytics, 30000);
});
