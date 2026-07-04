const express = require('express');
const { 
  sendMessage, getChatHistory, getConversations, 
  deleteMessageForEveryone, deleteConversation 
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/history/:userId', protect, getChatHistory);
router.get('/conversations', protect, getConversations);
router.delete('/message/:id', protect, deleteMessageForEveryone);
router.delete('/conversations/:recipientId', protect, deleteConversation);

module.exports = router;
