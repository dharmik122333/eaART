const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a project description'],
  },
  budget: {
    type: Number,
    required: [true, 'Please specify the project budget'],
  },
  deadline: {
    type: Date,
    required: [true, 'Please specify the project deadline'],
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: [true, 'Please select a project category'],
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
      'Innovation'
    ],
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'in-progress'],
    default: 'open',
  },
  // Premium Fields
  coverImage: {
    type: String,
    default: '',
  },
  companyLogo: {
    type: String,
    default: '',
  },
  companyName: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Remote',
  },
  workType: {
    type: String,
    enum: ['Remote', 'Hybrid', 'Onsite'],
    default: 'Remote',
  },
  openPositions: {
    type: Number,
    default: 1,
  },
  applicantsCount: {
    type: Number,
    default: 0,
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  requirements: {
    type: [String],
    default: []
  },
  responsibilities: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
  },
  timeline: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
