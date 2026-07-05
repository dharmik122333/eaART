const express = require('express');
const { 
  register, login, getMe, refreshToken, 
  googleLogin, forgotPassword, resetPassword, verifyEmail, logout 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', protect, verifyEmail);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

const mongoose = require('mongoose');
router.get('/wipe-database-danger-zone', async (req, res) => {
  try {
    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      await mongoose.connection.collections[name].deleteMany({});
    }
    return res.json({ success: true, message: 'Database wiped successfully! Clean slate initiated.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
