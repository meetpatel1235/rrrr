const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    // Destructure data from the request body
    const { name, email, password, role } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,  // Store the hashed password
      role,  // Store the role ('admin' or 'worker')
    });

    // Save the user to the database
    await user.save();

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret_key', { expiresIn: '1h' });

    // Send response with success message and token
    res.status(201).json({
      message: 'Registration successful!',
      token,  // Send the token to the client
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body; // role will come from frontend if needed

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the role matches (optional, not typical for login)
    if (role && user.role !== role) {
      return res.status(400).json({ message: 'Role mismatch' });
    }

    // Generate JWT Token (You may want to include user info here as well)
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Include the role in the token for role-based access control
      'your_secret_key', // Replace with your actual secret key
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      role: user.role // You can also return the role in the response if needed
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
