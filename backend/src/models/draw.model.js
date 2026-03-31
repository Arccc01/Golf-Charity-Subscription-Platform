const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchCount:    { type: Number, enum: [3, 4, 5], required: true },
  prizeAmount:   { type: Number, required: true },
  matchedNumbers:{ type: [Number], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  proofUrl:      { type: String, default: null },    // screenshot upload
  verified:      { type: Boolean, default: false },  // admin approved
});

const drawSchema = new mongoose.Schema({
  month: {
    type: String,   // e.g. "2026-03" — one draw per month
    required: true,
    unique: true,
  },

  status: {
    type: String,
    enum: ['pending', 'simulated', 'published'],
    default: 'pending',
    // pending   → draw not run yet
    // simulated → admin previewed results, not yet official
    // published → official, users can see results
  },

  mode: {
    type: String,
    enum: ['random', 'weighted'],
    default: 'random',
  },

  winningNumbers: {
    type: [Number],   // exactly 5 numbers, range 1–45
    default: [],
  },

  prizePool: {
    total:      { type: Number, default: 0 }, // total pool this month
    jackpot:    { type: Number, default: 0 }, // 40% (may include rollover)
    fourMatch:  { type: Number, default: 0 }, // 35%
    threeMatch: { type: Number, default: 0 }, // 25%
    rollover:   { type: Number, default: 0 }, // carried from previous month
  },

  winners: [winnerSchema],

  jackpotRolledOver: {
    type: Boolean,
    default: false, // true if nobody won the jackpot this month
  },

  totalSubscribers: {
    type: Number,
    default: 0, // snapshot of how many subscribers were in this draw
  },

}, { timestamps: true });

module.exports = mongoose.model('Draw', drawSchema);