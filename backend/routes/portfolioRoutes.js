const express = require('express');
const { addPortfolioItem, getCreatorPortfolio, deletePortfolioItem } = require('../controllers/portfolioController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, authorize('Creator'), upload.single('media'), addPortfolioItem);
router.get('/creator/:creatorId', getCreatorPortfolio);
router.delete('/:id', protect, authorize('Creator'), deletePortfolioItem);

module.exports = router;
