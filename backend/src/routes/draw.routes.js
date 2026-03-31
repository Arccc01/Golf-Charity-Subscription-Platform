const express  = require('express');
const router   = express.Router();
const {getPublishedDraws, 
    getDrawResult,
    simulateDraw,
    publishDraw,
    getMyResult,
    getAdminDraws} = require('../controllers/draw.controller');

const { requireAuth, requireAdmin }= require('../middleware/auth.middleware');

//  PUBLIC: get all published draws 
router.get('/', getPublishedDraws);

// PUBLIC: get a specific draw result 
router.get('/:month', getDrawResult);

//  ADMIN: simulate a draw (preview before publishing)
// This lets admin see results without making them official
router.post('/simulate', requireAuth, requireAdmin, simulateDraw);

// ADMIN: publish a draw officially
// Only works if draw was simulated first
router.post('/publish/:month', requireAuth, requireAdmin, publishDraw);

// SUBSCRIBER: check if I won in a specific draw
router.get('/my-result/:month', requireAuth, getMyResult);

//  ADMIN: get all draws including simulated 
router.get('/admin/all', requireAuth, requireAdmin, getAdminDraws);


module.exports = router;