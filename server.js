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
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  notes: { type: String, default: '' }
});
const Order = mongoose.model('Order', orderSchema);

// --- Test Route ---
app.get('/', (req, res) => {
  res.send('✅ Your backend server is running and connected to the database.');
});

// --- API Endpoints ---
app.get('/api/orders', async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

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

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateData = { status };
    
    // Set completedAt timestamp when order is completed or canceled
    if (status === 'completed' || status === 'canceled') {
      updateData.completedAt = new Date();
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update order' });
  }
});

// GET route to fetch completed and canceled orders for CSV export
app.get('/api/orders/completed-canceled', async (req, res) => {
  try {
    const completedCanceledOrders = await Order.find({ 
      status: { $in: ['completed', 'canceled'] } 
    }).sort({ completedAt: -1 });
    res.json(completedCanceledOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch completed/canceled orders' });
  }
});

// GET route to fetch all orders for analytics
app.get('/api/orders/all', async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ createdAt: -1 });
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
});

// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});