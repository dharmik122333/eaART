const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for your portfolio item'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  mediaURL: {
    type: String,
    required: [true, 'Please upload a media file (image/video)'],
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Please specify media type (image/video)'],
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
