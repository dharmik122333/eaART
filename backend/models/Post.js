const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a post title'],
    trim: true,
  },
  caption: {
    type: String,
    default: '',
  },
  media: {
    type: [String],
    default: [],
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'text', 'multiple_images'],
    default: 'text',
  },
  category: {
    type: String,
    default: 'General',
  },
  tags: {
    type: [String],
    default: [],
  },
  location: {
    type: String,
    default: '',
  },
  visibility: {
    type: String,
    enum: ['public', 'connections'],
    default: 'public',
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  sharesCount: {
    type: Number,
    default: 0,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }]
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Post', PostSchema);
