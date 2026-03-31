const express = require('express');
const { requireAuth, requireSubscription } = require('../middleware/auth.middleware');
const router = express.Router();
const {getScores,
    addNewScore,
    editScore,
    deleteScore} = require('../controllers/score.controller');


// ─── GET: fetch user's current scores ────────────────────────────────────────
router.get('/', requireAuth,getScores); 


// ─── POST: add a new score ────────────────────────────────────────────────────
router.post('/', requireAuth,  addNewScore);


// ─── PUT: edit an existing score ──────────────────────────────────────────────
router.put('/:scoreId', requireAuth,editScore);


// ─── DELETE: remove a specific score ─────────────────────────────────────────
router.delete('/:scoreId', requireAuth, requireSubscription,deleteScore);


module.exports = router;