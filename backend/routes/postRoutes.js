const express = require('express');
const {
  createPost,
  getPosts,
  getPostById,
  likePost,
  bookmarkPost,
  votePoll,
  deletePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, upload.array('media', 5), createPost);
router.get('/', protect, getPosts);
router.get('/:id', getPostById);
router.post('/:id/like', protect, likePost);
router.post('/:id/bookmark', protect, bookmarkPost);
router.post('/:id/poll/vote', protect, votePoll);
router.delete('/:id', protect, deletePost);

module.exports = router;
