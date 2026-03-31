const jwt = require('jsonwebtoken');

// requireAuth — user must be logged in
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'No token — please log in' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role } now available in route handlers
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// requireSubscription — user must be logged in AND have an active subscription
const requireSubscription = async (req, res, next) => {
  const User = require('../models/user.model');
  const user = await User.findById(req.user.userId);
  if (!user || user.subscription.status !== 'active') {
    return res.status(403).json({ message: 'Active subscription required' });
  }
  next();
};

// requireAdmin — admins only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

module.exports = { requireAuth, requireSubscription, requireAdmin };