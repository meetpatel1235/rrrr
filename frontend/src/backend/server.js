const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker'], default: 'worker' }
});

// Inventory Item Schema
const InventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameGujarati: { type: String, required: true }, // વાસણ name in Gujarati
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Order Schema
const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
  }],
  eventDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'pending', 'completed'], default: 'upcoming' },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Invoice Schema
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const InventoryItem = mongoose.model('InventoryItem', InventoryItemSchema);
const Order = mongoose.model('Order', OrderSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });

    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Inventory Routes
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/inventory', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = new InventoryItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Order Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const orders = await Order.find(filter)
      .populate('items.item')
      .populate('createdBy', 'username');
      
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${String(orderCount + 1).padStart(4, '0')}`;
    
    const order = new Order({
      ...req.body,
      orderNumber,
      createdBy: req.user.id,
    });
    
    await order.save();
    
    // Update inventory quantities
    for (const item of req.body.items) {
      await InventoryItem.findByIdAndUpdate(item.item, {
        $inc: { quantity: -item.quantity }
      });
    }
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If order completed, handle inventory return
    if (status === 'completed') {
      for (const item of order.items) {
        await InventoryItem.findByIdAndUpdate(item.item, {
          $inc: { quantity: item.quantity }
        });
      }
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invoice Routes
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate({
        path: 'order',
        populate: {
          path: 'items.item createdBy',
          select: 'name nameGujarati price username'
        }
      });
      
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV${String(invoiceCount + 1).padStart(4, '0')}`;
    
    const invoice = new Invoice({
      ...req.body,
      invoiceNumber
    });
    
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/invoices/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create initial admin user if none exists
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created: email - admin@example.com, password - admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createAdminUser();
});
