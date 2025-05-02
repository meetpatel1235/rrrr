const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker'], required: true }, // Define role with possible values 'admin' and 'worker'
});

const User = mongoose.model('User', userSchema);

module.exports = User;
