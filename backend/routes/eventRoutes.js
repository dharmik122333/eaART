const express = require('express');
const { getEvents, getEventById, attendEvent, createEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getEvents);
router.post('/', protect, createEvent);
router.get('/:id', getEventById);
router.post('/:id/attend', protect, attendEvent);

module.exports = router;
