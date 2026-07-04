const express = require('express');
const { 
  updateProfile, uploadProfileImage, getCreators, getCreatorById,
  getUserByUsername, deleteAccount, deactivateAccount,
  adminGetAllUsers, adminDeleteUser, adminDeletePost
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);
router.get('/creators', getCreators);
router.get('/creators/:id', getCreatorById); // Keep for legacy fallback compatibility
router.get('/profile/:username', getUserByUsername);
router.delete('/profile', protect, deleteAccount);
router.put('/deactivate', protect, deactivateAccount);

// Admin Moderation Endpoints
router.get('/admin/all', protect, adminGetAllUsers);
router.delete('/admin/user/:id', protect, adminDeleteUser);
router.delete('/admin/post/:id', protect, adminDeletePost);

module.exports = router;
