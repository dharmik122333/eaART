const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

const JWT_SECRET = process.env.JWT_SECRET || 'project_earth_secret_123456';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

// Helper to sign JWT token
const getSignedToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, category, skills, location, organization } = req.body;

    if (isMongoConnected()) {
      // --- MongoDB Mode ---
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        category: role === 'Creator' ? (category || '') : '',
        skills: role === 'Creator' ? (skills || []) : [],
        location: location || '',
        organization: role === 'Recruiter' ? (organization || '') : '',
      });

      const token = getSignedToken(user._id);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
        }
      });
    } else {
      // --- Fallback Local File DB Mode ---
      const userExists = fallbackDb.findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }

      // Hash password manually for fallback
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = fallbackDb.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        category: role === 'Creator' ? (category || '') : '',
        skills: role === 'Creator' ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean)) : [],
        location: location || '',
        organization: role === 'Recruiter' ? (organization || '') : '',
        profileImage: '',
        bio: '',
        availability: true
      });

      const token = getSignedToken(user._id);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    if (isMongoConnected()) {
      // --- MongoDB Mode ---
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = getSignedToken(user._id);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
        }
      });
    } else {
      // --- Fallback Local File DB Mode ---
      const user = fallbackDb.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = getSignedToken(user._id);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.id);
      return res.status(200).json({ success: true, user });
    } else {
      const user = fallbackDb.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
