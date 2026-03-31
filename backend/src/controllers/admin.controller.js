const User    = require('../models/user.model');
const Score   = require('../models/score.model');
const Draw    = require('../models/draw.model');
const Charity = require('../models/charity.model');
const payment = require('../models/payment.model');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');


async function getAnalytics(req,res){
    try {
    // Run all queries in parallel for speed
    const [
      totalUsers,
      activeSubscribers,
      cancelledSubs,
      lapsedSubs,
      totalCharities,
      draws,
      charities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.status': 'active' }),
      User.countDocuments({ 'subscription.status': 'cancelled' }),
      User.countDocuments({ 'subscription.status': 'lapsed' }),
      Charity.countDocuments({ isActive: true }),
      Draw.find({ status: 'published' }).sort({ createdAt: -1 }),
      Charity.find({ isActive: true }).select('name totalReceived'),
    ]);

    // Total prize pool ever distributed
    const totalPrizePool = draws.reduce(
      (sum, d) => sum + (d.prizePool.total || 0), 0
    );

    // Total charity contributions ever recorded
    const totalCharityContributions = charities.reduce(
      (sum, c) => sum + (c.totalReceived || 0), 0
    );

    // Monthly revenue estimate (active subscribers × plan price)
    const monthlyRevenue = activeSubscribers * 499;

    // Draw stats
    const drawStats = draws.map(d => ({
      month:            d.month,
      totalSubscribers: d.totalSubscribers,
      prizePool:        d.prizePool.total,
      winnerCount:      d.winners.length,
      jackpotRolledOver:d.jackpotRolledOver,
    }));

    res.json({
      users: {
        total:       totalUsers,
        active:      activeSubscribers,
        cancelled:   cancelledSubs,
        lapsed:      lapsedSubs,
        inactive:    totalUsers - activeSubscribers - cancelledSubs - lapsedSubs,
      },
      revenue: {
        estimatedMonthly: monthlyRevenue,
        totalPrizePool,
        totalCharityContributions,
      },
      charities: {
        total: totalCharities,
        breakdown: charities,
      },
      draws: {
        total:     draws.length,
        history:   drawStats,
        lastDraw:  drawStats[0] || null,
      },
    });

  } catch (err) {
    res.status(500).json({ message: 'Could not load analytics', error: err.message });
  }
}

async function getUsers(req, res) {
    try {
    const {
      page     = 1,
      limit    = 20,
      search   = '',
      status   = '',  // filter by subscription status
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query['subscription.status'] = status;
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password') // never return passwords
      .populate('selectedCharity', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      users,
      pagination: {
        total,
        page:       Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        limit:      Number(limit),
      },
    });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users', error: err.message });
  }
}

async function getSingleUserProfile(req,res){
    try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('selectedCharity', 'name imageUrl');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Also fetch their scores
    const scoreDoc = await Score.findOne({ userId: req.params.userId });
    const scores   = scoreDoc
      ? [...scoreDoc.scores].sort((a, b) => new Date(b.datePlayed) - new Date(a.datePlayed))
      : [];

    // Fetch their draw history
    const wonDraws = await Draw.find({
      status: 'published',
      'winners.userId': req.params.userId,
    }).select('month winningNumbers winners');

    const winHistory = wonDraws.map(d => {
      const entry = d.winners.find(w => w.userId.toString() === req.params.userId);
      return {
        month:         d.month,
        matchCount:    entry.matchCount,
        prizeAmount:   entry.prizeAmount,
        paymentStatus: entry.paymentStatus,
        verified:      entry.verified,
      };
    });

    res.json({ user, scores, winHistory });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch user', error: err.message });
  }
}

async function editUserProfile(req,res){
    try {
    const { name, email, role } = req.body;

    // Build update object — only include fields that were actually sent
    const updates = {};
    if (name)  updates.name  = name;
    if (email) updates.email = email.toLowerCase();
    if (role && ['subscriber', 'admin'].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated', user });

  } catch (err) {
    res.status(500).json({ message: 'Could not update user', error: err.message });
  }
}

async function editSubscriptionManually(req,res){
    try {
    const { status, plan } = req.body;

    const allowed = ['active', 'inactive', 'cancelled', 'lapsed'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updates = {};
    if (status) updates['subscription.status'] = status;
    if (plan)   updates['subscription.plan']   = plan;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Subscription updated', subscription: user.subscription });

  } catch (err) {
    res.status(500).json({ message: 'Could not update subscription', error: err.message });
  }
}


async function userDelete(req,res){
    try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 'subscription.status': 'cancelled' },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User account deactivated' });

  } catch (err) {
    res.status(500).json({ message: 'Could not deactivate user', error: err.message });
  }
}

async function userScoresExtraction(req,res){
    try {
    const scoreDoc = await Score.findOne({ userId: req.params.userId });

    if (!scoreDoc) return res.json({ scores: [] });

    const sorted = [...scoreDoc.scores].sort(
      (a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)
    );

    res.json({ scores: sorted });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch scores', error: err.message });
  }
}

async function SpecificScoreUpdate(req,res){
    try {
    const { points, datePlayed } = req.body;

    if (points && (points < 1 || points > 45)) {
      return res.status(400).json({ message: 'Score must be between 1 and 45' });
    }

    const scoreDoc = await Score.findOne({ userId: req.params.userId });
    if (!scoreDoc) return res.status(404).json({ message: 'No scores found for this user' });

    const entry = scoreDoc.scores.id(req.params.scoreId);
    if (!entry)  return res.status(404).json({ message: 'Score entry not found' });

    if (points)     entry.points     = points;
    if (datePlayed) entry.datePlayed = new Date(datePlayed);

    await scoreDoc.save();

    res.json({ message: 'Score updated by admin', scores: scoreDoc.scores });

  } catch (err) {
    res.status(500).json({ message: 'Could not update score', error: err.message });
  }
}

async function SpecificScoreDelete(req,res){
     try {
    const scoreDoc = await Score.findOne({ userId: req.params.userId });
    if (!scoreDoc) return res.status(404).json({ message: 'No scores found' });

    scoreDoc.scores = scoreDoc.scores.filter(
      s => s._id.toString() !== req.params.scoreId
    );

    await scoreDoc.save();

    res.json({ message: 'Score deleted by admin', scores: scoreDoc.scores });

  } catch (err) {
    res.status(500).json({ message: 'Could not delete score', error: err.message });
  }
}

async function viewEveryPayments(req,res){
    try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type)   query.type   = type;

    const skip     = (Number(page) - 1) * Number(limit);
    const total    = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('userId',   'name email')
      .populate('charityId','name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Total revenue from paid payments
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total / 100 || 0;

    res.json({
      payments,
      totalRevenue,
      pagination: {
        total,
        page:       Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch payments', error: err.message });
  }
}

module.exports = {
    getAnalytics,
    getUsers,
    getSingleUserProfile,
    editUserProfile,
    editSubscriptionManually,
    userDelete,
    userScoresExtraction,
    SpecificScoreUpdate,
    SpecificScoreDelete,
    viewEveryPayments
}