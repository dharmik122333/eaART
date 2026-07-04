const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'hired'],
    default: 'pending',
  },
  proposal: {
    type: String,
    required: [true, 'Please provide a proposal or message for the recruiter'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Avoid duplicate applications by same creator to the same project
ApplicationSchema.index({ projectId: 1, creatorId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
