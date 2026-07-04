const express = require('express');
const { 
  sendMessage, getChatHistory, getConversations, 
  deleteMessageForEveryone, deleteConversation,
  uploadMessageMedia, toggleMessageReaction
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/history/:userId', protect, getChatHistory);
router.get('/conversations', protect, getConversations);
router.delete('/message/:id', protect, deleteMessageForEveryone);
router.delete('/conversations/:recipientId', protect, deleteConversation);
router.post('/upload', protect, upload.single('file'), uploadMessageMedia);
router.post('/message/:id/react', protect, toggleMessageReaction);

module.exports = router;
