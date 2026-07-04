const Community = require('../models/Community');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
exports.getCommunities = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const communities = await Community.find();
      return res.status(200).json({ success: true, count: communities.length, communities });
    } else {
      const communities = fallbackDb.findCommunities();
      return res.status(200).json({ success: true, count: communities.length, communities });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single community details
// @route   GET /api/communities/:id
// @access  Public
exports.getCommunityById = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const community = await Community.findById(req.params.id);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
      return res.status(200).json({ success: true, community });
    } else {
      const community = fallbackDb.findCommunityById(req.params.id);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
      return res.status(200).json({ success: true, community });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const community = await Community.findById(communityId);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });

      if (community.members.includes(userId)) {
        return res.status(400).json({ success: false, error: 'Already a member of this community' });
      }

      community.members.push(userId);
      await community.save();

      return res.status(200).json({ success: true, community });
    } else {
      const community = fallbackDb.joinCommunity(communityId, userId);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
      return res.status(200).json({ success: true, community });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const community = await Community.findById(communityId);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });

      community.members = community.members.filter(m => m.toString() !== userId);
      await community.save();

      return res.status(200).json({ success: true, community });
    } else {
      const community = fallbackDb.leaveCommunity(communityId, userId);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
      return res.status(200).json({ success: true, community });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Please provide a community name' });
    }

    if (isMongoConnected()) {
      const exists = await Community.findOne({ name });
      if (exists) return res.status(400).json({ success: false, error: 'Community already exists with this name' });

      const community = await Community.create({ name, description, coverImage, members: [req.user.id] });
      return res.status(201).json({ success: true, community });
    } else {
      const db = require('../utils/dbFallback').readData = () => {
        const raw = require('fs').readFileSync(require('path').join(__dirname, '../data/db.json'), 'utf8');
        return JSON.parse(raw);
      };
      
      const exists = fallbackDb.findCommunities().some(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) return res.status(400).json({ success: false, error: 'Community already exists with this name' });

      const community = fallbackDb.createCommunity({ name, description, coverImage, members: [req.user.id] });
      return res.status(201).json({ success: true, community });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
