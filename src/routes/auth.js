// src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // re-use your auth middleware

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ msg: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email used' });

    const user = await User.create({ name, email, password, role });
    // Optionally return token + user so client immediately has ID
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    // return token and basic user info (without password)
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ msg: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    // Return token AND user object (so client gets the _id)
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Debug: get currently authenticated user
router.get('/me', auth, async (req, res) => {
  // req.user is populated by auth middleware (selecting user without password)
  res.json({ user: req.user });
});

module.exports = router;
