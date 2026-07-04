const fs = require('fs');
const path = require('path');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

const createAlert = async (recipientId, senderId, type, message, referenceId) => {
  try {
    if (recipientId.toString() === senderId.toString()) return;
    if (isMongoConnected()) {
      await Notification.create({ recipientId, senderId, type, message, referenceId });
    } else {
      fallbackDb.createNotification({ recipientId, senderId, type, message, referenceId });
    }
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !text) {
      return res.status(400).json({ success: false, error: 'Recipient ID and message text are required' });
    }

    if (isMongoConnected()) {
      const recipient = await User.findById(recipientId);
      if (!recipient) return res.status(404).json({ success: false, error: 'Recipient not found' });

      let message = await Message.create({ senderId, recipientId, text });
      message = await Message.findById(message._id)
        .populate('senderId', 'name profileImage')
        .populate('recipientId', 'name profileImage');

      // Trigger notification
      await createAlert(recipientId, senderId, 'message', `${req.user.name} sent you a message.`, message._id);

      return res.status(201).json({ success: true, message });
    } else {
      const recipient = fallbackDb.findUserById(recipientId);
      if (!recipient) return res.status(404).json({ success: false, error: 'Recipient not found' });

      let message = fallbackDb.createMessage({ senderId, recipientId, text });
      message = {
        ...message,
        senderId: { _id: req.user.id, name: req.user.name, profileImage: req.user.profileImage },
        recipientId: { _id: recipient._id, name: recipient.name, profileImage: recipient.profileImage }
      };

      await createAlert(recipientId, senderId, 'message', `${req.user.name} sent you a message.`, message._id);

      return res.status(201).json({ success: true, message });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get chat history between current user and target user
// @route   GET /api/messages/history/:userId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const senderId = req.user.id;

    if (isMongoConnected()) {
      // Find messages sent by sender to recipient, or by recipient to sender
      const messages = await Message.find({
        $or: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId }
        ]
      })
      .populate('senderId', 'name profileImage')
      .populate('recipientId', 'name profileImage')
      .sort({ createdAt: 1 });

      // Mark messages received by current user as read
      await Message.updateMany({ senderId: recipientId, recipientId: senderId, isRead: false }, { isRead: true });

      return res.status(200).json({ success: true, count: messages.length, messages });
    } else {
      const messages = fallbackDb.findMessages({ senderId, recipientId });
      
      const dbPath = path.join(__dirname, '../data/db.json');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      
      let changed = false;
      data.messages.forEach(m => {
        if (m.senderId === recipientId && m.recipientId === senderId && !m.isRead) {
          m.isRead = true;
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }

      // Sort chronological asc
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return res.status(200).json({ success: true, count: messages.length, messages });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get conversation lists (active chat headers)
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    if (isMongoConnected()) {
      // Find all messages involving current user
      const messages = await Message.find({
        $or: [{ senderId: currentUserId }, { recipientId: currentUserId }]
      })
      .populate('senderId', 'name profileImage headline')
      .populate('recipientId', 'name profileImage headline')
      .sort({ createdAt: -1 });

      const conversationsMap = {};

      messages.forEach(msg => {
        const otherUser = msg.senderId._id.toString() === currentUserId 
          ? msg.recipientId 
          : msg.senderId;

        const otherUserId = otherUser._id.toString();

        if (!conversationsMap[otherUserId]) {
          conversationsMap[otherUserId] = {
            user: otherUser,
            lastMessage: msg.text,
            createdAt: msg.createdAt,
            isRead: msg.senderId._id.toString() === currentUserId ? true : msg.isRead
          };
        }
      });

      const conversations = Object.values(conversationsMap);
      return res.status(200).json({ success: true, count: conversations.length, conversations });
    } else {
      const messages = fallbackDb.findMessages({});
      const activeMsgs = messages.filter(m => {
        const sId = m.senderId?._id || m.senderId;
        const rId = m.recipientId?._id || m.recipientId;
        return sId === currentUserId || rId === currentUserId;
      });

      // Sort desc
      activeMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const conversationsMap = {};
      activeMsgs.forEach(msg => {
        const sId = msg.senderId?._id || msg.senderId;
        const rId = msg.recipientId?._id || msg.recipientId;
        
        const otherUser = sId === currentUserId ? msg.recipientId : msg.senderId;
        const otherUserId = otherUser._id || otherUser;

        if (!conversationsMap[otherUserId]) {
          conversationsMap[otherUserId] = {
            user: otherUser,
            lastMessage: msg.text,
            createdAt: msg.createdAt,
            isRead: sId === currentUserId ? true : msg.isRead
          };
        }
      });

      const conversations = Object.values(conversationsMap);
      return res.status(200).json({ success: true, count: conversations.length, conversations });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete message for everyone
// @route   DELETE /api/messages/message/:id
// @access  Private
exports.deleteMessageForEveryone = async (req, res) => {
  try {
    const msgId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const message = await Message.findById(msgId);
      if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
      if (message.senderId.toString() !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      message.text = 'This message was deleted';
      message.deletedForEveryone = true;
      message.media = '';
      message.fileName = '';
      await message.save();
      return res.status(200).json({ success: true, message });
    } else {
      const message = fallbackDb.deleteMessageForEveryone(msgId);
      if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
      return res.status(200).json({ success: true, message });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete entire conversation
// @route   DELETE /api/messages/conversations/:recipientId
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.id;

    if (isMongoConnected()) {
      await Message.deleteMany({
        $or: [
          { senderId: userId, recipientId },
          { senderId: recipientId, recipientId: userId }
        ]
      });
      return res.status(200).json({ success: true });
    } else {
      fallbackDb.deleteConversation(userId, recipientId);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
