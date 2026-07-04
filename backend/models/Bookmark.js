const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Avoid duplicate bookmarks for the same item by the same user
BookmarkSchema.index({ userId: 1, postId: 1, projectId: 1 });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
