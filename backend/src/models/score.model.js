const mongoose = require('mongoose');

const singleScoreSchema = new mongoose.Schema({
  points: {
    type: Number,
    required: true,
    min: [1, 'Score must be at least 1'],
    max: [45, 'Score cannot exceed 45'],
  },
  datePlayed: {
    type: Date,
    required: true,
  },
}, { _id: true }); // each score entry gets its own id — useful for editing/deleting


const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one score document per user
  },
  scores: {
    type: [singleScoreSchema],
    default: [],
    validate: {
      // Extra safety — MongoDB level enforcement of max 5
      validator: (arr) => arr.length <= 5,
      message: 'A user cannot have more than 5 scores',
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Score', scoreSchema);