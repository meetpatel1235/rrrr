const express = require('express');
const router = express.Router();

// Dummy login route (you will improve this later)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // You can later verify email/password from MongoDB
  if (
    (email === 'admin@rasoi.com' && password === 'admin123') ||
    (email === 'worker@rasoi.com' && password === 'worker123')
  ) {
    return res.status(200).json({ message: 'Login successful', token: 'fake-jwt-token' });
  }
  
});

module.exports = router;
