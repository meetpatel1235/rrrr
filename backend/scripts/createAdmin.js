// scripts/createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Define User Schema (or Admin schema)
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
});

const Admin = mongoose.model('Admin', adminSchema);

// 2. Create Admin
const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email: 'admin@rasoi.com' });
    if (existing) {
      console.log('Admin already exists');
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new Admin({
      email: 'admin@rasoi.com',
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
