const express = require('express');
const { addComment, getComments, addReply } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, addComment);
router.get('/post/:postId', getComments);
router.post('/:id/reply', protect, addReply);

module.exports = router;
