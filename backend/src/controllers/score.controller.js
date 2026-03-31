const Score = require('../models/score.model');

async function getScores(req, res) {
  try {
    const scoreDoc = await Score.findOne({ userId: req.user.userId });

    if (!scoreDoc) {
      return res.json({ scores: [] }); // no scores yet — that's fine
    }

    // Sort newest first before sending
    const sorted = [...scoreDoc.scores].sort(
      (a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)
    );

    res.json({ scores: sorted });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch scores', error: err.message });
  }
}

async function addNewScore(req, res) {
  try {
    const { points, datePlayed } = req.body;

    // Validate input
    if (!points || !datePlayed) {
      return res.status(400).json({ message: 'points and datePlayed are required' });
    }
    if (points < 1 || points > 45) {
      return res.status(400).json({ message: 'Score must be between 1 and 45' });
    }

    const dateObj = new Date(datePlayed);
    if (isNaN(dateObj)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (dateObj > new Date()) {
      return res.status(400).json({ message: 'Score date cannot be in the future' });
    }

    // Find or create the score document for this user
    let scoreDoc = await Score.findOne({ userId: req.user.userId });

    if (!scoreDoc) {
      scoreDoc = new Score({ userId: req.user.userId, scores: [] });
    }

    // Add new score at the beginning (newest first)
    scoreDoc.scores.unshift({ points, datePlayed: dateObj });

    // THE ROLLING LOGIC — if more than 5, remove the last one (oldest)
    if (scoreDoc.scores.length > 5) {
      scoreDoc.scores.pop(); // pop() removes the last element
    }

    await scoreDoc.save();

    // Return sorted newest first
    const sorted = [...scoreDoc.scores].sort(
      (a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)
    );

    res.status(201).json({
      message: 'Score added successfully',
      scores: sorted,
    });

  } catch (err) {
    res.status(500).json({ message: 'Could not add score', error: err.message });
  }
}

 async function editScore (req, res) {
  try {
    const { points, datePlayed } = req.body;
    const { scoreId } = req.params;

    if (points && (points < 1 || points > 45)) {
      return res.status(400).json({ message: 'Score must be between 1 and 45' });
    }

    const scoreDoc = await Score.findOne({ userId: req.user.userId });
    if (!scoreDoc) {
      return res.status(404).json({ message: 'No scores found for this user' });
    }

    // Find the specific score entry by its _id
    const entry = scoreDoc.scores.id(scoreId);
    if (!entry) {
      return res.status(404).json({ message: 'Score entry not found' });
    }

    // Update only the fields that were sent
    if (points)     entry.points     = points;
    if (datePlayed) entry.datePlayed = new Date(datePlayed);

    await scoreDoc.save();

    const sorted = [...scoreDoc.scores].sort(
      (a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)
    );

    res.json({ message: 'Score updated', scores: sorted });

  } catch (err) {
    res.status(500).json({ message: 'Could not update score', error: err.message });
  }
}

async function deleteScore(req, res) {
  try {
    const { scoreId } = req.params;

    const scoreDoc = await Score.findOne({ userId: req.user.userId });
    if (!scoreDoc) {
      return res.status(404).json({ message: 'No scores found' });
    }

    const before = scoreDoc.scores.length;

    // Remove the score with this id
    scoreDoc.scores = scoreDoc.scores.filter(
      (s) => s._id.toString() !== scoreId
    );

    if (scoreDoc.scores.length === before) {
      return res.status(404).json({ message: 'Score not found' });
    }

    await scoreDoc.save();

    const sorted = [...scoreDoc.scores].sort(
      (a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)
    );

    res.json({ message: 'Score deleted', scores: sorted });

  } catch (err) {
    res.status(500).json({ message: 'Could not delete score', error: err.message });
  }
}

module.exports = {
    getScores,
    addNewScore,
    editScore,
    deleteScore
}