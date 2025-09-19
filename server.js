const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const mongoDBConnectionString = process.env.MONGO_URL;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
mongoose.connect(mongoDBConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch((error) => console.error('❌ Error connecting to MongoDB:', error));

// --- Database Schemas & Models ---
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  status: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// NEW: Menu Item Schema & Model
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: String,
    imageUrl: String
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);


// --- API Endpoints for Orders ---
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
    const { table, notes, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }
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


// --- NEW: API Endpoints for Menu Management ---

// GET all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch menu items' });
    }
});

// POST a new menu item
app.post('/api/menu', async (req, res) => {
    try {
        const newItem = new MenuItem({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description || ''
        });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create menu item. Does it already exist?' });
    }
});

// DELETE a menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete menu item' });
    }
});


// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});