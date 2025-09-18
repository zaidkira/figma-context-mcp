const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// This reads the secret database URL from Render's environment variables
const mongoDBConnectionString = process.env.MONGO_URL;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
mongoose.connect(mongoDBConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((error) => console.error('❌ Error connecting to MongoDB:', error));

// --- Mongoose Schema & Model ---
// NEW: Added the 'notes' field to the schema
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  status: String,
  notes: String, // Added this line
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// --- Test Route ---
app.get('/', (req, res) => {
  res.send('✅ Your backend server is running and connected to the database.');
});

// --- API Endpoints ---

// GET route to fetch all PENDING orders for the dashboard
app.get('/api/orders', async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// NEW: GET route to fetch ALL orders for analytics
app.get('/api/orders/all', async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ createdAt: -1 });
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
});

// NEW: GET route to fetch completed/canceled orders for CSV export
app.get('/api/orders/completed-canceled', async (req, res) => {
  try {
    const finishedOrders = await Order.find({ 
      status: { $in: ['completed', 'canceled'] } 
    }).sort({ updatedAt: -1 });
    res.json(finishedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch completed/canceled orders' });
  }
});

// POST route to create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      table: req.body.table,
      name: req.body.name,
      qty: req.body.qty,
      status: 'pending',
      notes: req.body.notes // Added this line
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
    const updatedOrder = await Order.findByIdAndUpdate(id, { status: status, updatedAt: Date.now() }, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update order' });
  }
});

// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});