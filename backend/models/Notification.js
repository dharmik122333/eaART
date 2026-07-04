const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  type: {
    type: String,
    enum: [
      'follow', 'like', 'comment', 'share', 'view_profile', 
      'hire', 'collaborate', 'message', 'project_match'
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null, // References Post, Project, Application, etc.
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
