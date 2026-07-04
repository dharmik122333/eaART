const express = require('express');
const { addComment, getComments, addReply, likeComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, addComment);
router.get('/post/:postId', getComments);
router.post('/:id/reply', protect, addReply);
router.post('/:id/like', protect, likeComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
