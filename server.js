const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const mongoDBConnectionString = process.env.MONGO_URL || 'mongodb+srv://zaiddendane:yhkQqdaR0CegNGr2@cluster0.wzxvdqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Basic request logging to help diagnose 404s
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});
// Serve static frontend assets
app.use(express.static(__dirname));

// Serve a favicon to avoid 404s
app.get('/favicon.ico', (_req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'assets', 'images', 'icon-heart-1.svg'));
  } catch (_) {
    res.status(204).end();
  }
});

// --- Connect to MongoDB ---
if (mongoDBConnectionString) {
  mongoose.connect(mongoDBConnectionString)
    .then(() => console.log('✅ Successfully connected to MongoDB!'))
    .catch((error) => {
      console.error('❌ Error connecting to MongoDB:', error);
      console.log('⚠️  Running in offline mode - some features may not work');
    });
} else {
  console.log('⚠️  No MongoDB connection string provided - running in offline mode');
}

// --- Database Schemas & Models ---
const orderSchema = new mongoose.Schema({
  table: String,
  name: String,
  qty: Number,
  price: Number,
  status: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// NEW: Menu Item Schema & Model
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: String,
    imageUrl: String,
    category: { type: String, default: 'Other' }
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- In-Memory Storage for Offline Mode ---
let inMemoryOrders = [];
let inMemoryMenuItems = [
  { _id: 'mem1', name: 'Espresso', price: 150, description: 'Rich and bold coffee', category: 'Coffee' },
  { _id: 'mem2', name: 'Latte', price: 200, description: 'Smooth espresso with steamed milk', category: 'Coffee' },
  { _id: 'mem3', name: 'Cappuccino', price: 180, description: 'Espresso with equal parts milk and foam', category: 'Coffee' },
  { _id: 'mem4', name: 'Americano', price: 120, description: 'Espresso with hot water', category: 'Coffee' },
  { _id: 'mem5', name: 'Mocha', price: 220, description: 'Espresso with chocolate and steamed milk', category: 'Coffee' },
  { _id: 'mem6', name: 'Iced Coffee', price: 160, description: 'Cold brewed coffee over ice', category: 'Cold' }
];

// Helper function to check if MongoDB is connected
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}


// --- API Endpoints for Orders ---

// GET pending orders
app.get('/api/orders', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: 1 }); // Sort oldest first
      res.json(pendingOrders);
    } else {
      // Use in-memory storage when MongoDB is not available
      const pendingOrders = inMemoryOrders.filter(order => order.status === 'pending')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      res.json(pendingOrders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Fallback to in-memory storage on error
    const pendingOrders = inMemoryOrders.filter(order => order.status === 'pending')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(pendingOrders);
  }
});

// GET completed and canceled orders for export
app.get('/api/orders/completed-canceled', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const finishedOrders = await Order.find({ status: { $in: ['completed', 'canceled'] } }).sort({ updatedAt: -1 });
      res.json(finishedOrders);
    } else {
      // Use in-memory storage when MongoDB is not available
      const finishedOrders = inMemoryOrders.filter(order => 
        order.status === 'completed' || order.status === 'canceled'
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      res.json(finishedOrders);
    }
  } catch (error) {
    console.error('Error fetching orders for export:', error);
    // Fallback to in-memory storage on error
    const finishedOrders = inMemoryOrders.filter(order => 
      order.status === 'completed' || order.status === 'canceled'
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(finishedOrders);
  }
});


app.post('/api/orders', async (req, res) => {
  try {
    const { table, notes, items } = req.body;
    console.log('Received order:', { table, notes, items });
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }
    
    // Group all items under a single creation timestamp
    const creationTime = new Date();
    
    if (isMongoConnected()) {
      const orderPromises = items.map(item => {
        const newOrder = new Order({
          table: table,
          name: item.name,
          qty: item.qty,
          price: item.price || 0,
          status: 'pending',
          notes: notes,
          createdAt: creationTime,
          updatedAt: creationTime
        });
        return newOrder.save();
      });

      await Promise.all(orderPromises);
    } else {
      // Use in-memory storage when MongoDB is not available
      items.forEach(item => {
        const newOrder = {
          _id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          table: table,
          name: item.name,
          qty: item.qty,
          price: item.price || 0,
          status: 'pending',
          notes: notes,
          createdAt: creationTime,
          updatedAt: creationTime
        };
        inMemoryOrders.push(newOrder);
      });
    }
    
    res.status(201).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(400).json({ message: 'Failed to save order' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('Updating order:', { id, status });
    
    if (isMongoConnected()) {
      const updatedOrder = await Order.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
      res.json(updatedOrder);
    } else {
      // Use in-memory storage when MongoDB is not available
      const orderIndex = inMemoryOrders.findIndex(order => order._id === id);
      if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      inMemoryOrders[orderIndex].status = status;
      inMemoryOrders[orderIndex].updatedAt = new Date();
      res.json(inMemoryOrders[orderIndex]);
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: 'Failed to update order' });
  }
});


// --- NEW: API Endpoints for Menu Management ---

// GET all menu items
app.get('/api/menu', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const menuItems = await MenuItem.find({});
            res.json(menuItems);
        } else {
            // Use in-memory storage when MongoDB is not available
            res.json(inMemoryMenuItems);
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
        // Fallback to in-memory storage on error
        res.json(inMemoryMenuItems);
    }
});

// POST a new menu item
app.post('/api/menu', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const newItem = new MenuItem({
                name: req.body.name,
                price: req.body.price,
                description: req.body.description || '',
                imageUrl: req.body.imageUrl || '',
                category: req.body.category || 'Other'
            });
            const savedItem = await newItem.save();
            res.status(201).json(savedItem);
        } else {
            // Use in-memory storage when MongoDB is not available
            const newItem = {
                _id: 'mem' + Date.now(),
                name: req.body.name,
                price: req.body.price,
                description: req.body.description || '',
                imageUrl: req.body.imageUrl || '',
                category: req.body.category || 'Other'
            };
            
            // Check if item already exists
            const existingItem = inMemoryMenuItems.find(item => item.name === newItem.name);
            if (existingItem) {
                return res.status(400).json({ message: 'Menu item already exists' });
            }
            
            inMemoryMenuItems.push(newItem);
            res.status(201).json(newItem);
        }
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(400).json({ message: 'Failed to create menu item. Does it already exist?' });
    }
});

// DELETE a menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
            if (!deletedItem) {
                return res.status(404).json({ message: 'Menu item not found' });
            }
            res.json({ message: 'Menu item deleted successfully' });
        } else {
            // Use in-memory storage when MongoDB is not available
            const itemIndex = inMemoryMenuItems.findIndex(item => item._id === req.params.id);
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Menu item not found' });
            }
            
            inMemoryMenuItems.splice(itemIndex, 1);
            res.json({ message: 'Menu item deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Failed to delete menu item' });
    }
});


// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});