const Notification = require('../models/Notification');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      const notifications = await Notification.find({ recipientId: userId })
        .populate('senderId', 'name profileImage')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, count: notifications.length, notifications });
    } else {
      const notifications = fallbackDb.findNotificationsByRecipient(userId);
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: notifications.length, notifications });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markRead = async (req, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const notification = await Notification.findOneAndUpdate(
        { _id: notifId, recipientId: userId },
        { isRead: true },
        { new: true }
      );
      if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
      return res.status(200).json({ success: true, notification });
    } else {
      const notification = fallbackDb.markNotificationRead(notifId, userId);
      if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
      return res.status(200).json({ success: true, notification });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      await Notification.updateMany({ recipientId: userId }, { isRead: true });
      return res.status(200).json({ success: true });
    } else {
      fallbackDb.markAllNotificationsRead(userId);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
