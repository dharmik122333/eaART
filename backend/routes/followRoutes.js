const express = require('express');
const { toggleFollow, getFollowers, getFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/:id', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
