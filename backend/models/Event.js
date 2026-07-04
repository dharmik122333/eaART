const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add an event description'],
  },
  type: {
    type: String,
    enum: [
      'Hackathon', 'Game Jam', 'Film Festival', 
      'Music Competition', 'Startup Event', 'Workshop', 'Meetup'
    ],
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Please specify the event date'],
  },
  location: {
    type: String,
    required: [true, 'Please specify event location / online links'],
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Event', EventSchema);
