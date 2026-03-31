const Draw    = require('../models/draw.model');

async function getMyWins(req, res){
  try {
    // Find all published draws where this user is in the winners array
    const draws = await Draw.find({
      status: 'published',
      'winners.userId': req.user.userId,
    }).select('month winningNumbers winners prizePool');

    // Extract only this user's winner entry from each draw
    const myWins = draws.map(draw => {
      const myEntry = draw.winners.find(
        w => w.userId.toString() === req.user.userId
      );
      return {
        month:          draw.month,
        winningNumbers: draw.winningNumbers,
        matchCount:     myEntry.matchCount,
        prizeAmount:    myEntry.prizeAmount,
        matchedNumbers: myEntry.matchedNumbers,
        paymentStatus:  myEntry.paymentStatus,
        verified:       myEntry.verified,
        proofUrl:       myEntry.proofUrl,
        winnerId:       myEntry._id, // needed for proof upload
      };
    });

    const totalWon = myWins.reduce((sum, w) => sum + w.prizeAmount, 0);

    res.json({ myWins, totalWon });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch wins', error: err.message });
  }
}

async function uploadProof(req, res){
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { drawMonth, winnerId } = req.params;

      const draw = await Draw.findOne({ month: drawMonth, status: 'published' });
      if (!draw) {
        return res.status(404).json({ message: 'Draw not found' });
      }

      // Find this user's winner entry inside the draw
      const winnerEntry = draw.winners.id(winnerId);
      if (!winnerEntry) {
        return res.status(404).json({ message: 'Winner entry not found' });
      }

      // Make sure this winner belongs to the requesting user
      if (winnerEntry.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'This is not your winner entry' });
      }

      // Save the proof image URL — accessible via /uploads/filename
      winnerEntry.proofUrl = `/uploads/${req.file.filename}`;
      await draw.save();

      res.json({
        message: 'Proof uploaded successfully — awaiting admin verification',
        proofUrl: winnerEntry.proofUrl,
      });

    } catch (err) {
      res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  }

async function getPendingVerifications(req, res) {
  try {
    // Find draws that have at least one unverified winner with proof uploaded
    const draws = await Draw.find({
      status: 'published',
      'winners.verified': false,
      'winners.proofUrl': { $ne: null },
    }).populate('winners.userId', 'name email');

    // Flatten into a clean list for the admin dashboard
    const pending = [];
    draws.forEach(draw => {
      draw.winners.forEach(w => {
        if (!w.verified && w.proofUrl) {
          pending.push({
            drawMonth:     draw.month,
            drawId:        draw._id,
            winnerId:      w._id,
            user:          w.userId,   // populated: { name, email }
            matchCount:    w.matchCount,
            prizeAmount:   w.prizeAmount,
            matchedNumbers:w.matchedNumbers,
            proofUrl:      w.proofUrl,
            paymentStatus: w.paymentStatus,
          });
        }
      });
    });

    res.json({ pending, count: pending.length });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch pending verifications', error: err.message });
  }
}

async function getAllWinners(req, res) {
  try {
    const draws = await Draw.find({ status: 'published' })
      .populate('winners.userId', 'name email')
      .sort({ createdAt: -1 });

    const allWinners = [];
    draws.forEach(draw => {
      draw.winners.forEach(w => {
        allWinners.push({
          drawMonth:     draw.month,
          winnerId:      w._id,
          user:          w.userId,
          matchCount:    w.matchCount,
          prizeAmount:   w.prizeAmount,
          matchedNumbers:w.matchedNumbers,
          proofUrl:      w.proofUrl,
          verified:      w.verified,
          paymentStatus: w.paymentStatus,
        });
      });
    });

    res.json({ winners: allWinners, total: allWinners.length });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch winners', error: err.message });
  }
}

async function approveWinner (req, res) {
    try {
      const { drawMonth, winnerId } = req.params;
      const { action } = req.body; // 'approve' or 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'action must be approve or reject' });
      }

      const draw = await Draw.findOne({ month: drawMonth });
      if (!draw) return res.status(404).json({ message: 'Draw not found' });

      const winnerEntry = draw.winners.id(winnerId);
      if (!winnerEntry) return res.status(404).json({ message: 'Winner not found' });

      if (action === 'approve') {
        winnerEntry.verified      = true;
        winnerEntry.paymentStatus = 'pending'; // ready to be paid out
      } else {
        // Rejected — clear proof so they can re-upload if it was a mistake
        winnerEntry.verified  = false;
        winnerEntry.proofUrl  = null;
      }

      await draw.save();

      res.json({
        message: action === 'approve'
          ? 'Winner verified — marked as pending payout'
          : 'Winner rejected — proof cleared',
        winnerId,
        verified:      winnerEntry.verified,
        paymentStatus: winnerEntry.paymentStatus,
      });

    } catch (err) {
      res.status(500).json({ message: 'Verification failed', error: err.message });
    }
  }

  async function markWinnerAsPaid(req, res) {
    try {
      const { drawMonth, winnerId } = req.params;

      const draw = await Draw.findOne({ month: drawMonth });
      if (!draw) return res.status(404).json({ message: 'Draw not found' });

      const winnerEntry = draw.winners.id(winnerId);
      if (!winnerEntry) return res.status(404).json({ message: 'Winner not found' });

      if (!winnerEntry.verified) {
        return res.status(400).json({ message: 'Cannot mark as paid — winner not verified yet' });
      }

      winnerEntry.paymentStatus = 'paid';
      await draw.save();

      res.json({
        message:       'Payment marked as completed',
        winnerId,
        paymentStatus: 'paid',
      });

    } catch (err) {
      res.status(500).json({ message: 'Could not mark as paid', error: err.message });
    }
  }

  module.exports = {
    getMyWins,
    uploadProof,
    getPendingVerifications,
    getAllWinners,
    approveWinner,
    markWinnerAsPaid
  }