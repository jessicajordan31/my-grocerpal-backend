// routes/user.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/Users');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET /api/user/profile - Get logged-in user info (name, email)
router.get('/profile', authMiddleware, async (req, res) => {
    console.log('User ID from token:', req.userId);
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/change-password - Change password

router.post('/change-password', authMiddleware, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.userId, { passwordHash: hashedPassword });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// DELETE /api/user/delete-account - Delete user account
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;