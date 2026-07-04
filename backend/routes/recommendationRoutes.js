const express = require('express');
const { getRecommendedPosts } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', protect, getRecommendedPosts);

module.exports = router;
