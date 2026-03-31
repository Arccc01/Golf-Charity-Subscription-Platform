const Draw     = require('../models/draw.model');
const Score    = require('../models/score.model');
const User     = require('../models/user.model');
const { runDraw } = require('../utils/drawEngine');
const { calculatePrizePool, splitPrize }= require('../utils/prizePool');

async function getPublishedDraws(req, res) {
  try {
    const draws = await Draw.find({ status: 'published' })
      .select('-winners.userId') // don't expose user IDs publicly
      .sort({ createdAt: -1 });

    res.json({ draws });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch draws', error: err.message });
  }
}

async function getDrawResult(req, res) {
  try {
    const draw = await Draw.findOne({
      month: req.params.month,
      status: 'published',
    }).populate('winners.userId', 'name'); // show winner names only

    if (!draw) return res.status(404).json({ message: 'Draw not found or not published yet' });

    res.json({ draw });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch draw', error: err.message });
  }
}

async function simulateDraw(req, res) {
  try {
    const { mode = 'random' } = req.body;

    // Current month string e.g. "2026-03"
    const month = new Date().toISOString().slice(0, 7);

    // Get all active subscribers
    const activeUsers = await User.find({ 'subscription.status': 'active' });
    if (activeUsers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers to run draw for' });
    }

    const activeUserIds = activeUsers.map(u => u._id);

    // Get their scores
    const scoreDocs = await Score.find({ userId: { $in: activeUserIds } });

    // Check for rollover from previous month
    const prevMonth = getPreviousMonth(month);
    const prevDraw  = await Draw.findOne({ month: prevMonth, jackpotRolledOver: true });
    const rollover  = prevDraw ? prevDraw.prizePool.jackpot : 0;

    // Calculate prize pool
    const prizePool = calculatePrizePool(activeUsers, rollover);

    // Run the draw engine
    const { winningNumbers, matches } = await runDraw(mode, scoreDocs);

    // Build winner list with prize amounts
    const fiveMatchPrize  = splitPrize(prizePool.jackpot,    matches.fiveMatch.length);
    const fourMatchPrize  = splitPrize(prizePool.fourMatch,  matches.fourMatch.length);
    const threeMatchPrize = splitPrize(prizePool.threeMatch, matches.threeMatch.length);

    const winners = [
      ...matches.fiveMatch.map(w => ({
        ...w, matchCount: 5, prizeAmount: fiveMatchPrize })),
      ...matches.fourMatch.map(w => ({
        ...w, matchCount: 4, prizeAmount: fourMatchPrize })),
      ...matches.threeMatch.map(w => ({
        ...w, matchCount: 3, prizeAmount: threeMatchPrize })),
    ];

    // Save as simulated — NOT published yet
    // Upsert so re-simulating the same month just overwrites
    await Draw.findOneAndUpdate(
      { month },
      {
        month, mode, status: 'simulated',
        winningNumbers, prizePool,
        winners, totalSubscribers: activeUsers.length,
        jackpotRolledOver: matches.fiveMatch.length === 0,
      },
      { upsert: true, new: true }
    );

    res.json({
      message:        'Simulation complete — review before publishing',
      month,
      winningNumbers,
      prizePool,
      winners,
      totalSubscribers: activeUsers.length,
      jackpotRolledOver: matches.fiveMatch.length === 0,
    });

  } catch (err) {
    res.status(500).json({ message: 'Simulation failed', error: err.message });
  }
}

async function publishDraw(req, res) {
  try {
    const draw = await Draw.findOne({ month: req.params.month });

    if (!draw) {
      return res.status(404).json({ message: 'No draw found. Run simulate first.' });
    }
    if (draw.status === 'published') {
      return res.status(400).json({ message: 'Draw already published' });
    }

    draw.status = 'published';
    await draw.save();

    // Update charity totals — distribute charity portion from subscription fees
    // This is where charity contributions get recorded
    await recordCharityContributions(draw.totalSubscribers);

    res.json({ message: `Draw for ${req.params.month} published successfully`, draw });

  } catch (err) {
    res.status(500).json({ message: 'Could not publish draw', error: err.message });
  }
}

async function getMyResult(req, res){
  try {
    const draw = await Draw.findOne({
      month: req.params.month,
      status: 'published',
    });

    if (!draw) return res.status(404).json({ message: 'Draw not found or not published' });

    const myResult = draw.winners.find(
      w => w.userId.toString() === req.user.userId
    );

    if (!myResult) {
      return res.json({
        won: false,
        winningNumbers: draw.winningNumbers,
        message: 'You did not win this draw',
      });
    }

    res.json({
      won:            true,
      winningNumbers: draw.winningNumbers,
      matchCount:     myResult.matchCount,
      prizeAmount:    myResult.prizeAmount,
      matchedNumbers: myResult.matchedNumbers,
      paymentStatus:  myResult.paymentStatus,
    });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch result', error: err.message });
  }
}

async function getAdminDraws(req, res) {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    res.json({ draws });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch draws', error: err.message });
  }
}

// ─── Helper: record charity contributions when draw publishes ─────────────────
async function recordCharityContributions(subscriberCount) {
  const Charity = require('../models/Charity');

  // Get all subscribers with their charity selections
  const users = await User.find({ 'subscription.status': 'active' })
    .select('selectedCharity charityPercentage subscription');

  for (const user of users) {
    if (!user.selectedCharity) continue;

    const planPrice    = user.subscription.plan === 'yearly' ? 4999 / 12 : 499;
    const contribution = Math.floor(planPrice * (user.charityPercentage / 100));

    await Charity.findByIdAndUpdate(
      user.selectedCharity,
      { $inc: { totalReceived: contribution } } // increment running total
    );
  }
}

// ─── Helper: get previous month string ───────────────────────────────────────
function getPreviousMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 2); // month is 0-indexed in JS Date
  return date.toISOString().slice(0, 7);
}

module.exports = {
    getPublishedDraws, 
    getDrawResult,
    simulateDraw,
    publishDraw,
    getMyResult,
    getAdminDraws
}