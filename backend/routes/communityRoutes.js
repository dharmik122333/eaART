const express = require('express');
const { getCommunities, getCommunityById, joinCommunity, leaveCommunity, createCommunity } = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCommunities);
router.post('/', protect, createCommunity);
router.get('/:id', getCommunityById);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;
