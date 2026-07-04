const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Prevents password from being returned in API queries by default
  },
  role: {
    type: String,
    enum: ['Creator', 'Recruiter'],
    required: [true, 'Please specify user role'],
  },
  profileImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    enum: [
      'Arts & Design',
      'Film & Entertainment',
      'Gaming',
      'Music & Audio',
      'Technology',
      'Photography',
      'Fashion & Beauty',
      'Events',
      'Writing',
      'Architecture',
      'Innovation',
      '' // Recruiter or empty option
    ],
    default: '',
  },
  availability: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    default: '',
  },
  organization: {
    type: String,
    default: '', // For recruiters
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user typed password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
