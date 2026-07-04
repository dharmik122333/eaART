const express = require('express');
const { sendMessage, getChatHistory, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/history/:userId', protect, getChatHistory);

module.exports = router;
