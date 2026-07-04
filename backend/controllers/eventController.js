const Event = require('../models/Event');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const events = await Event.find().sort({ date: 1 });
      return res.status(200).json({ success: true, count: events.length, events });
    } else {
      const events = fallbackDb.findEvents();
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      return res.status(200).json({ success: true, count: events.length, events });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const event = await Event.findById(req.params.id).populate('organizerId', 'name organization');
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.status(200).json({ success: true, event });
    } else {
      const event = fallbackDb.findEventById(req.params.id);
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.status(200).json({ success: true, event });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attend / register for an event
// @route   POST /api/events/:id/attend
// @access  Private
exports.attendEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

      if (event.attendees.includes(userId)) {
        return res.status(400).json({ success: false, error: 'Already registered to attend this event' });
      }

      event.attendees.push(userId);
      await event.save();

      return res.status(200).json({ success: true, event });
    } else {
      const event = fallbackDb.attendEvent(eventId, userId);
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.status(200).json({ success: true, event });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, date, location } = req.body;

    if (!title || !description || !type || !date || !location) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const eventData = {
      title,
      description,
      type,
      date,
      location,
      organizerId: req.user.id,
      attendees: [req.user.id]
    };

    if (isMongoConnected()) {
      const event = await Event.create(eventData);
      return res.status(201).json({ success: true, event });
    } else {
      const event = fallbackDb.createEvent(eventData);
      return res.status(201).json({ success: true, event });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
