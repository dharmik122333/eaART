const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  media: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    default: '',
  },
  fileType: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Message', MessageSchema);
