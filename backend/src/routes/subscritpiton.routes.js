require('dotenv').config()
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const {createOrder,
  verifyPayment,
  webhookController,
  getMyPayments} = require ('../controllers/subscription.controller')


const router = express.Router();

// Frontend calls this first to get an order_id before opening the popup
router.post('/create-order', requireAuth, createOrder);


// After the popup closes, frontend sends these 3 IDs here for verification
router.post('/verify-payment', requireAuth,verifyPayment);

// Set this URL in: Razorpay Dashboard → Settings → Webhooks
router.post('/webhook', express.raw({ type: 'application/json' }),webhookController );

router.get('/my-payments', requireAuth, getMyPayments);



module.exports = router;