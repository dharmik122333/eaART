const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

const JWT_SECRET = process.env.JWT_SECRET || 'project_earth_secret_123456';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || 'project_earth_refresh_secret_123456';

// Helper to sign access token
const getSignedToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' }); // 15 minute access tokens
};

// Helper to sign refresh token
const getSignedRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_JWT_SECRET, { expiresIn: '30d' }); // 30 day refresh tokens
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, role, category, skills, location, organization } = req.body;

    let targetUsername = username;
    if (!targetUsername) {
      const base = name ? name.toLowerCase().replace(/[^a-z0-9_]/g, '') : (email ? email.split('@')[0].replace(/[^a-z0-9_]/g, '') : 'user');
      targetUsername = base + Math.floor(100 + Math.random() * 900);
    }

    const cleanUsername = targetUsername.startsWith('@') ? targetUsername.substring(1) : targetUsername;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Usernames can only contain letters, numbers, and underscores' });
    }

    if (isMongoConnected()) {
      // 1. Check email duplicate
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }

      // 2. Check username duplicate
      const usernameExists = await User.findOne({ username: cleanUsername.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ success: false, error: 'Username handle is already taken' });
      }

      const user = await User.create({
        name,
        username: cleanUsername.toLowerCase(),
        email,
        password,
        role,
        category: role === 'Creator' ? (category || '') : '',
        skills: role === 'Creator' ? (skills || []) : [],
        location: location || '',
        organization: role === 'Recruiter' ? (organization || '') : '',
      });

      const token = getSignedToken(user._id);
      const refreshToken = getSignedRefreshToken(user._id);
      
      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      return res.status(201).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
          isAdmin: user.isAdmin
        }
      });
    } else {
      // --- Fallback Mode ---
      const emailExists = fallbackDb.findUserByEmail(email);
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }

      const usernameExists = fallbackDb.findUserByUsername(cleanUsername);
      if (usernameExists) {
        return res.status(400).json({ success: false, error: 'Username handle is already taken' });
      }

      // Hash password manually for fallback
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = fallbackDb.createUser({
        name,
        username: cleanUsername.toLowerCase(),
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
      const refreshToken = getSignedRefreshToken(user._id);
      
      fallbackDb.updateUser(user._id, { refreshToken });

      return res.status(201).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
          isAdmin: user.isAdmin
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
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = getSignedToken(user._id);
      const refreshToken = getSignedRefreshToken(user._id);

      await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

      return res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
          isAdmin: user.isAdmin
        }
      });
    } else {
      const user = fallbackDb.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = getSignedToken(user._id);
      const refreshToken = getSignedRefreshToken(user._id);

      fallbackDb.updateUser(user._id, { refreshToken });

      return res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          category: user.category,
          skills: user.skills,
          location: user.location,
          organization: user.organization,
          profileImage: user.profileImage,
          bio: user.bio,
          availability: user.availability,
          isAdmin: user.isAdmin
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Refresh session token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    if (isMongoConnected()) {
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ success: false, error: 'Session expired. Please log in again' });
      }
      const token = getSignedToken(user._id);
      return res.status(200).json({ success: true, token });
    } else {
      const user = fallbackDb.findUserById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ success: false, error: 'Session expired. Please log in again' });
      }
      const token = getSignedToken(user._id);
      return res.status(200).json({ success: true, token });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Google login / signup endpoint
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, profileImage } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Invalid Google payload details' });
    }

    if (isMongoConnected()) {
      let user = await User.findOne({ email });
      if (!user) {
        const uniqueUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Date.now().toString().slice(-3);
        user = await User.create({
          name,
          username: uniqueUsername,
          email,
          role: 'Creator', // Default to creator
          profileImage: profileImage || '',
          emailVerified: true
        });
      }

      const token = getSignedToken(user._id);
      const refreshToken = getSignedRefreshToken(user._id);
      await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

      return res.status(200).json({ success: true, token, refreshToken, user });
    } else {
      let user = fallbackDb.findUserByEmail(email);
      if (!user) {
        const uniqueUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Date.now().toString().slice(-3);
        user = fallbackDb.createUser({
          name,
          username: uniqueUsername,
          email,
          role: 'Creator',
          profileImage: profileImage || '',
          emailVerified: true
        });
      }

      const token = getSignedToken(user._id);
      const refreshToken = getSignedRefreshToken(user._id);
      fallbackDb.updateUser(user._id, { refreshToken });

      return res.status(200).json({ success: true, token, refreshToken, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 char alphanumeric
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let userFound = false;

    if (isMongoConnected()) {
      const user = await User.findOne({ email });
      if (user) {
        await User.updateOne(
          { _id: user._id },
          { $set: { passwordResetToken: resetToken, passwordResetExpires: expires } }
        );
        userFound = true;
      }
    } else {
      const user = fallbackDb.findUserByEmail(email);
      if (user) {
        fallbackDb.updateUser(user._id, {
          passwordResetToken: resetToken,
          passwordResetExpires: expires.toISOString()
        });
        userFound = true;
      }
    }

    // Mock Mailer Alert
    console.log(`[MAIL SYSTEM - FORGOT PASSWORD] To: ${email} | Code: ${resetToken}`);

    // Always respond with success to prevent email enumeration attacks
    return res.status(200).json({
      success: true,
      message: 'If email exists, verification code has been dispatched.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(450).json({ success: false, error: 'Please provide email, code, and new password' });
    }

    if (isMongoConnected()) {
      const user = await User.findOne({ 
        email, 
        passwordResetToken: code,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await User.updateOne(
        { _id: user._id },
        {
          $set: { password: hashedPassword },
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 }
        }
      );
      return res.status(200).json({ success: true, message: 'Password has been updated' });
    } else {
      const user = fallbackDb.findUserByEmail(email);
      if (!user || user.passwordResetToken !== code || new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      fallbackDb.updateUser(user._id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      return res.status(200).json({ success: true, message: 'Password has been updated' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
// @access  Private
exports.verifyEmail = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.id);
      await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
      return res.status(200).json({ success: true, user });
    } else {
      const user = fallbackDb.updateUser(req.user.id, { emailVerified: true });
      return res.status(200).json({ success: true, user });
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

// @desc    Logout user (clear refresh tokens)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.id);
      if (user) {
        await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1 } });
      }
    } else {
      fallbackDb.updateUser(req.user.id, { refreshToken: null });
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
