const Portfolio = require('../models/Portfolio');
const { uploadMedia } = require('../utils/cloudinaryHelper');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');
const path = require('path');

// @desc    Add portfolio item
// @route   POST /api/portfolios
// @access  Private (Creator Only)
exports.addPortfolioItem = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Please provide title and description' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a media file (image/video)' });
    }

    // Upload to Cloudinary or serve local URL
    const uploadResult = await uploadMedia(req.file.path, 'portfolios');

    // Detect media type from extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi'];
    const mediaType = videoExtensions.includes(ext) ? 'video' : 'image';

    if (isMongoConnected()) {
      const portfolioItem = await Portfolio.create({
        title,
        description,
        mediaURL: uploadResult.url,
        mediaType,
        creatorId: req.user.id
      });
      return res.status(201).json({ success: true, portfolioItem });
    } else {
      const portfolioItem = fallbackDb.createPortfolio({
        title,
        description,
        mediaURL: uploadResult.url,
        mediaType,
        creatorId: req.user.id
      });
      return res.status(201).json({ success: true, portfolioItem });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get portfolio items of a creator
// @route   GET /api/portfolios/creator/:creatorId
// @access  Public
exports.getCreatorPortfolio = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const portfolioItems = await Portfolio.find({ creatorId: req.params.creatorId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: portfolioItems.length, portfolioItems });
    } else {
      const portfolioItems = fallbackDb.findPortfoliosByCreator(req.params.creatorId);
      // Sort descending by date
      portfolioItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: portfolioItems.length, portfolioItems });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/portfolios/:id
// @access  Private (Creator Only, owner)
exports.deletePortfolioItem = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const portfolioItem = await Portfolio.findById(req.params.id);

      if (!portfolioItem) {
        return res.status(404).json({ success: false, error: 'Portfolio item not found' });
      }

      if (portfolioItem.creatorId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this portfolio item' });
      }

      await portfolioItem.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    } else {
      const portfolioItem = fallbackDb.findPortfolioById(req.params.id);

      if (!portfolioItem) {
        return res.status(404).json({ success: false, error: 'Portfolio item not found' });
      }

      if (portfolioItem.creatorId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this portfolio item' });
      }

      fallbackDb.deletePortfolio(req.params.id);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
