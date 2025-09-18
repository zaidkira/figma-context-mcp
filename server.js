const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Your connection string
const mongoDBConnectionString = 'mongodb+srv://zaiddendane:yhkQqdaR0CegNGr2@cluster0.wzxvdqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
mongoose.connect(mongoDBConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((error) => console.error('❌ Error connecting to MongoDB:', error));

// --- Mongoose Schema & Model ---
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);


// --- Test Route ---
app.get('/', (req, res) => {
  res.send('✅ Your backend server is running and connected to the database.');
});


// --- API Endpoints ---

// GET route to fetch all pending orders
app.get('/api/orders', async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// POST route to create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      table: req.body.table,
      name: req.body.name,
      qty: req.body.qty,
      status: 'pending'
    });
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Failed to save order' });
  }
});

// PATCH route to update an order's status
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update order' });
  }
});

// --- MODIFIED: Start the Server (Ready for Deployment) ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});