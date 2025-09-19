const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const mongoDBConnectionString = process.env.MONGO_URL || 'mongodb://localhost:27017/coffee-shop';

// --- Middleware ---
app.use(cors());
app.use(express.json());

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
    imageUrl: String
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- In-Memory Storage for Offline Mode ---
let inMemoryOrders = [];
let inMemoryMenuItems = [
  { _id: 'mem1', name: 'Espresso', price: 150, description: 'Rich and bold coffee' },
  { _id: 'mem2', name: 'Latte', price: 200, description: 'Smooth espresso with steamed milk' },
  { _id: 'mem3', name: 'Cappuccino', price: 180, description: 'Espresso with equal parts milk and foam' },
  { _id: 'mem4', name: 'Americano', price: 120, description: 'Espresso with hot water' },
  { _id: 'mem5', name: 'Mocha', price: 220, description: 'Espresso with chocolate and steamed milk' },
  { _id: 'mem6', name: 'Iced Coffee', price: 160, description: 'Cold brewed coffee over ice' }
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
                imageUrl: req.body.imageUrl || ''
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
                imageUrl: req.body.imageUrl || ''
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