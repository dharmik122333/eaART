const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a community name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Community', CommunitySchema);
