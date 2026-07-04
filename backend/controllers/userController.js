const User = require('../models/User');
const Post = require('../models/Post');
const Project = require('../models/Project');
const { uploadMedia } = require('../utils/cloudinaryHelper');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    const allowedFields = [
      'name', 'bio', 'location', 'availability', 'organization', 
      'coverBanner', 'headline', 'industry', 'experience', 'education', 'achievements'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // Handle password updating & hashing
    if (req.body.password !== undefined && req.body.password !== '') {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      fieldsToUpdate.password = await bcrypt.hash(req.body.password, salt);
    }

    // Enforce username change check
    if (req.body.username !== undefined) {
      const cleanUsername = req.body.username.startsWith('@') ? req.body.username.substring(1) : req.body.username;
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(cleanUsername)) {
        return res.status(400).json({ success: false, error: 'Usernames can only contain letters, numbers, and underscores' });
      }

      const requestedUsername = cleanUsername.toLowerCase();
      
      // If they changed it
      if (requestedUsername !== req.user.username) {
        if (isMongoConnected()) {
          const taken = await User.findOne({ username: requestedUsername });
          if (taken) {
            return res.status(400).json({ success: false, error: 'Username handle is already taken' });
          }
        } else {
          const taken = fallbackDb.findUserByUsername(requestedUsername);
          if (taken) {
            return res.status(400).json({ success: false, error: 'Username handle is already taken' });
          }
        }
        fieldsToUpdate.username = requestedUsername;
      }
    }

    if (req.user.role === 'Creator') {
      if (req.body.skills) {
        fieldsToUpdate.skills = Array.isArray(req.body.skills)
          ? req.body.skills
          : req.body.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (req.body.category !== undefined) {
        fieldsToUpdate.category = req.body.category;
      }
    }

    if (isMongoConnected()) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: fieldsToUpdate },
        { new: true, runValidators: true }
      );
      return res.status(200).json({ success: true, user });
    } else {
      const user = fallbackDb.updateUser(req.user.id, fieldsToUpdate);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found' });
      }
      return res.status(200).json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    const uploadResult = await uploadMedia(req.file.path, 'profiles');

    if (isMongoConnected()) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: uploadResult.url },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        profileImage: uploadResult.url,
        user
      });
    } else {
      const user = fallbackDb.updateUser(req.user.id, { profileImage: uploadResult.url });
      return res.status(200).json({
        success: true,
        profileImage: uploadResult.url,
        user
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all creators
// @route   GET /api/users/creators
// @access  Public
exports.getCreators = async (req, res) => {
  try {
    const { category, search, skills, availability } = req.query;

    if (isMongoConnected()) {
      const query = { role: 'Creator' };
      if (category) query.category = category;
      if (availability !== undefined) query.availability = availability === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      if (skills) {
        const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
        if (skillsList.length > 0) {
          query.skills = { $all: skillsList.map(skill => new RegExp(skill, 'i')) };
        }
      }

      const creators = await User.find(query);
      return res.status(200).json({ success: true, count: creators.length, creators });
    } else {
      const query = { role: 'Creator' };
      if (category) query.category = category;
      if (availability !== undefined) query.availability = availability === 'true';
      if (search) query.search = search;
      if (skills) query.skills = skills.split(',').map(s => s.trim()).filter(Boolean);

      const creators = fallbackDb.findUsers(query);
      return res.status(200).json({ success: true, count: creators.length, creators });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single creator details by ID
// @route   GET /api/users/creators/:id
// @access  Public
exports.getCreatorById = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const creator = await User.findOne({ _id: req.params.id, role: 'Creator' });
      if (!creator) {
        return res.status(404).json({ success: false, error: 'Creator not found' });
      }
      return res.status(200).json({ success: true, creator });
    } else {
      const creator = fallbackDb.findUserById(req.params.id);
      if (!creator || creator.role !== 'Creator') {
        return res.status(404).json({ success: false, error: 'Creator not found' });
      }
      return res.status(200).json({ success: true, creator });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single user details by username (Creator or Recruiter)
// @route   GET /api/users/profile/:username
// @access  Public
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

    // Decode token if sent to avoid self-view counts increment
    let viewerId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'project_earth_secret_123456');
        viewerId = decoded.id;
      } catch (err) {
        // ignore
      }
    }

    if (isMongoConnected()) {
      const creator = await User.findOne({ username: cleanUsername.toLowerCase() });
      if (!creator) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Check self view
      const isSelf = viewerId && viewerId.toString() === creator._id.toString();
      if (!isSelf) {
        creator.profileViews = (creator.profileViews || 0) + 1;
        await creator.save();
      }

      return res.status(200).json({ success: true, creator });
    } else {
      const creator = fallbackDb.findUserByUsername(cleanUsername);
      if (!creator) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const isSelf = viewerId && viewerId.toString() === creator._id.toString();
      if (!isSelf) {
        const views = (creator.profileViews || 0) + 1;
        fallbackDb.updateUser(creator._id, { profileViews: views });
        creator.profileViews = views;
      }

      return res.status(200).json({ success: true, creator });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      await User.findByIdAndDelete(userId);
      await Post.deleteMany({ authorId: userId });
      await Project.deleteMany({ recruiterId: userId });
      return res.status(200).json({ success: true, data: {} });
    } else {
      fallbackDb.deleteUser(userId);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Deactivate account
// @route   PUT /api/users/deactivate
// @access  Private
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      await User.findByIdAndUpdate(userId, { availability: false, bio: '[Deactivated Account]' });
      return res.status(200).json({ success: true });
    } else {
      fallbackDb.updateUser(userId, { availability: false, bio: '[Deactivated Account]' });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// --- Admin Moderation Panel Endpoints ---
// ==========================================

// @desc    Get all users for Admin
// @route   GET /api/users/admin/all
// @access  Private/Admin
exports.adminGetAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized Administrative action' });
    }

    if (isMongoConnected()) {
      const users = await User.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: users.length, users });
    } else {
      const db = require('../utils/dbFallback').readData = () => {
        const raw = require('fs').readFileSync(require('path').join(__dirname, '../data/db.json'), 'utf8');
        return JSON.parse(raw);
      };
      const users = fallbackDb.findUsers({});
      return res.status(200).json({ success: true, count: users.length, users });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin Delete User
// @route   DELETE /api/users/admin/user/:id
// @access  Private/Admin
exports.adminDeleteUser = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized Administrative action' });
    }

    const userId = req.params.id;
    if (isMongoConnected()) {
      await User.findByIdAndDelete(userId);
      await Post.deleteMany({ authorId: userId });
      await Project.deleteMany({ recruiterId: userId });
      return res.status(200).json({ success: true, data: {} });
    } else {
      fallbackDb.deleteUser(userId);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin Delete Post
// @route   DELETE /api/users/admin/post/:id
// @access  Private/Admin
exports.adminDeletePost = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized Administrative action' });
    }

    const postId = req.params.id;
    if (isMongoConnected()) {
      await Post.findByIdAndDelete(postId);
      return res.status(200).json({ success: true, data: {} });
    } else {
      fallbackDb.deletePost(postId);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Block / Unblock a User
// @route   POST /api/users/block/:id
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      const alreadyBlocked = user.blockedUsers && user.blockedUsers.includes(targetId);
      if (alreadyBlocked) {
        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId);
      } else {
        if (!user.blockedUsers) user.blockedUsers = [];
        user.blockedUsers.push(targetId);
      }
      await user.save();
      return res.status(200).json({ success: true, blocked: !alreadyBlocked });
    } else {
      const user = fallbackDb.blockUser(userId, targetId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      const blocked = user.blockedUsers && user.blockedUsers.includes(targetId);
      return res.status(200).json({ success: true, blocked });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Report a User
// @route   POST /api/users/report/:id
// @access  Private
exports.reportUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;
    console.log(`[USER REPORTED] Target: ${targetId} | Reporter: ${req.user.id} | Reason: ${reason}`);
    return res.status(200).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
