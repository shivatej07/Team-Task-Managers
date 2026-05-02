const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users — List all users (for adding to projects)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('name email role createdAt').sort({ name: 1 });
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
