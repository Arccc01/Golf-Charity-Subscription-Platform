const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'sports', 'community', 'other'],
    default: 'other',
  },
  isFeatured: {
    type: Boolean,
    default: false, // only one should be true at a time — enforced in the route
  },
  isActive: {
    type: Boolean,
    default: true, // soft delete — never actually remove from DB
  },
  upcomingEvents: [
    {
      title:     { type: String, required: true },
      date:      { type: Date,   required: true },
      location:  { type: String, default: null },
      description: { type: String, default: null },
    }
  ],
  totalReceived: {
    type: Number,
    default: 0, // running total of all contributions — updated when draws run
  },
}, { timestamps: true });

module.exports = mongoose.model('Charity', charitySchema);