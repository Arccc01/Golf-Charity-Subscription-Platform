const express = require('express');
const { requireAuth, requireSubscription, requireAdmin } = require('../middleware/auth.middleware');
const router  = express.Router();
const { getCharities,
    getFeaturedCharity,
    getSingleCharity,
    selectCharity,
    IndependentDonation,
    removeCharity,
    createCharity,
    editCharity,
    addEvent} = require('../controllers/charity.controller');

// Anyone can view charities — even non-subscribers
router.get('/', getCharities);

//  PUBLIC: get featured charity for homepage spotlight
router.get('/featured', getFeaturedCharity);

//PUBLIC: get single charity profile 
router.get('/:id',getSingleCharity);

// SUBSCRIBER: select a charity 
router.post('/select', requireAuth, requireSubscription, selectCharity);

//  SUBSCRIBER: make an independent donation 
// Separate from subscription — user donates any amount directly
router.post('/donate', requireAuth,IndependentDonation);

// ADMIN: create a charity 
router.post('/', requireAuth, requireAdmin,createCharity);

// ADMIN: edit a charity
router.put('/:id', requireAuth, requireAdmin,editCharity);

// ADMIN: soft delete a charity 
// We never hard delete — users may have this charity selected
router.delete('/:id', requireAuth, requireAdmin, removeCharity);

// ADMIN: add an upcoming event to a charity
router.post('/:id/events', requireAuth, requireAdmin,addEvent);


module.exports = router;