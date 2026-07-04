const Follower = require('../models/Follower');
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

// @desc    Follow or unfollow a creator
// @route   POST /api/follow/:id
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    const followingId = req.params.id; // User being followed
    const followerId = req.user.id;   // User following

    if (followingId.toString() === followerId.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot follow yourself' });
    }

    if (isMongoConnected()) {
      const targetUser = await User.findById(followingId);
      if (!targetUser) return res.status(404).json({ success: false, error: 'Target user not found' });

      const existingFollow = await Follower.findOne({ followerId, followingId });
      if (existingFollow) {
        // Unfollow
        await Follower.deleteOne({ _id: existingFollow._id });
        return res.status(200).json({ success: true, followed: false });
      } else {
        // Follow
        await Follower.create({ followerId, followingId });
        // Notify
        await createAlert(followingId, followerId, 'follow', `${req.user.name} followed you.`, followerId);
        return res.status(200).json({ success: true, followed: true });
      }
    } else {
      const targetUser = fallbackDb.findUserById(followingId);
      if (!targetUser) return res.status(404).json({ success: false, error: 'Target user not found' });

      const follows = fallbackDb.findFollowers({ followerId, followingId });
      if (follows.length > 0) {
        fallbackDb.deleteFollower(followerId, followingId);
        return res.status(200).json({ success: true, followed: false });
      } else {
        fallbackDb.createFollower({ followerId, followingId });
        await createAlert(followingId, followerId, 'follow', `${req.user.name} followed you.`, followerId);
        return res.status(200).json({ success: true, followed: true });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get followers of a user
// @route   GET /api/follow/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    if (isMongoConnected()) {
      const follows = await Follower.find({ followingId: userId }).populate('followerId', 'name profileImage headline availability');
      const followers = follows.map(f => f.followerId).filter(Boolean);
      return res.status(200).json({ success: true, count: followers.length, followers });
    } else {
      const follows = fallbackDb.findFollowers({ followingId: userId });
      const followers = follows.map(f => {
        const u = fallbackDb.findUserById(f.followerId);
        return u ? { _id: u._id, name: u.name, profileImage: u.profileImage, headline: u.headline, availability: u.availability } : null;
      }).filter(Boolean);
      return res.status(200).json({ success: true, count: followers.length, followers });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get users followed by a user
// @route   GET /api/follow/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    if (isMongoConnected()) {
      const follows = await Follower.find({ followerId: userId }).populate('followingId', 'name profileImage headline availability');
      const following = follows.map(f => f.followingId).filter(Boolean);
      return res.status(200).json({ success: true, count: following.length, following });
    } else {
      const follows = fallbackDb.findFollowers({ followerId: userId });
      const following = follows.map(f => {
        const u = fallbackDb.findUserById(f.followingId);
        return u ? { _id: u._id, name: u.name, profileImage: u.profileImage, headline: u.headline, availability: u.availability } : null;
      }).filter(Boolean);
      return res.status(200).json({ success: true, count: following.length, following });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
