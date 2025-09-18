const overlay = document.getElementById("overlay");
const modal = document.getElementById("order-modal");
const closeBtn = document.getElementById("modal-close");
const orderItem = document.getElementById("order-item");
const orderQty = document.getElementById("order-qty");
const confirmBtn = document.getElementById("confirm-order");

// Get table number from URL (e.g., ?table=5)
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table');

let currentQty = 1;

// --- Toast feedback ---
function showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) {
    toast.style.backgroundColor = '#9E1C08'; // Make error toasts red
  }
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// --- Modal open ---
document.querySelectorAll(".btn-chip").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    const name = card.querySelector(".card-title").textContent;
    orderItem.textContent = name;
    currentQty = 1;
    orderQty.textContent = currentQty;
    overlay.classList.add("active");
    modal.classList.add("active");
  });
});

// --- Modal close ---
function closeModal() {
  overlay.classList.remove("active");
  modal.classList.remove("active");
}
overlay.addEventListener("click", closeModal);
closeBtn.addEventListener("click", closeModal);

// --- Quantity controls ---
document.getElementById("increase").addEventListener("click", () => {
  currentQty++;
  orderQty.textContent = currentQty;
});
document.getElementById("decrease").addEventListener("click", () => {
  if (currentQty > 1) {
    currentQty--;
    orderQty.textContent = currentQty;
  }
});

// --- MODIFIED: Confirm order and send to backend server ---
confirmBtn.addEventListener("click", async () => {
  const order = {
    name: orderItem.textContent,
    qty: currentQty,
    table: tableNumber || 'Walk-in',
  };

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      // If the server responds with an error, throw an error to be caught below
      throw new Error(`Server error: ${response.statusText}`);
    }

    const savedOrder = await response.json();
    console.log('Order successfully sent to server:', savedOrder);
    showToast("✅ Order placed!");

  } catch (error) {
    console.error('There was a problem sending the order:', error);
    showToast("❌ Could not place order", true);
  }

  closeModal();
});