const User = require('../models/User');
const { uploadMedia } = require('../utils/cloudinaryHelper');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    const allowedFields = [
      'name', 'bio', 'location', 'availability', 'organization'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // Special handling for array and selection fields for Creators
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

    // Upload to Cloudinary or serve local URL
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

// @desc    Get all creators (with filters)
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
