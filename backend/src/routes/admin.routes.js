const express = require('express');
const router  = express.Router();
const {getAnalytics,
    getUsers,
    getSingleUserProfile,
    editUserProfile,
    editSubscriptionManually,
    userDelete,
    userScoresExtraction,
    SpecificScoreUpdate,
    SpecificScoreDelete,
    viewEveryPayments} = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// GET: full dashboard summary 
router.get('/analytics', requireAuth, requireAdmin, getAnalytics);

//  GET: all users with pagination and search
router.get('/users', requireAuth, requireAdmin, getUsers);

//GET: single user full profile 
router.get('/users/:userId', requireAuth, requireAdmin, getSingleUserProfile);

//PUT: edit a user profile
router.put('/users/:userId', requireAuth, requireAdmin,editUserProfile);

// PATCH: change subscription status manually 
// Useful for refunds, manual overrides, or test accounts
router.patch('/users/:userId/subscription', requireAuth, requireAdmin, editSubscriptionManually);

// DELETE: soft delete a user account 
// We deactivate rather than hard delete — preserves draw history integrity
router.delete('/users/:userId', requireAuth, requireAdmin,userDelete);

// GET: view any user's scores 
router.get('/users/:userId/scores', requireAuth, requireAdmin,userScoresExtraction);

// ─── PUT: edit a specific score for any user ──────────────────────────────────
router.put('/users/:userId/scores/:scoreId', requireAuth, requireAdmin,SpecificScoreUpdate);

// ─── DELETE: remove a specific score for any user ────────────────────────────
router.delete('/users/:userId/scores/:scoreId', requireAuth, requireAdmin, SpecificScoreDelete);
router.get('/payments', requireAuth, requireAdmin, viewEveryPayments);


module.exports = router;