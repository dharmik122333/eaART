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

module.exports = router;
