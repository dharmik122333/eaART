const express = require('express');
const { updateProfile, uploadProfileImage, getCreators, getCreatorById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);
router.get('/creators', getCreators);
router.get('/creators/:id', getCreatorById);

module.exports = router;
