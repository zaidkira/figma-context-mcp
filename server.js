const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const mongoDBConnectionString = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());

mongoose.connect(mongoDBConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((error) => console.error('❌ Error connecting to MongoDB:', error));

// UPDATED: Added 'notes' field for special requests
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  status: String,
  notes: String, // For special requests
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

app.get('/', (req, res) => {
  res.send('✅ Your backend server is running and connected to the database.');
});

// GET route for pending orders (for the dashboard)
app.get('/api/orders', async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// UPDATED: POST route now accepts an entire cart
app.post('/api/orders', async (req, res) => {
  try {
    const { table, notes, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    // Create a separate order document for each item in the cart
    const orderPromises = items.map(item => {
      const newOrder = new Order({
        table: table,
        name: item.name,
        qty: item.qty,
        status: 'pending',
        notes: notes
      });
      return newOrder.save();
    });

    await Promise.all(orderPromises);
    res.status(201).json({ message: 'Order placed successfully!' });

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});