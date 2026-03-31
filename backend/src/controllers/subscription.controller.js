const crypto  = require('crypto');
const Razorpay = require('razorpay');
const User    = require('../models/user.model');
const Payment = require('../models/payment.model');

// ─── Helper: calculate next billing date ─────────────────────────────────────
function getNextBillingDate(plan) {
  const date = new Date();
  if (plan === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

// ─── Helper: calculate charity contribution ───────────────────────────────────
function calcCharityContribution(amountInPaise, percentage = 10) {
  return Math.floor((amountInPaise / 100) * (percentage / 100));
}


// ════════════════════════════════════════════════════════
//  CREATE ORDER
// ════════════════════════════════════════════════════════
async function createOrder(req, res) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const PLANS = {
    monthly: { amount: 49900,  currency: 'INR' },
    yearly:  { amount: 499900, currency: 'INR' },
  };

  try {
    const { plan } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ message: `Invalid plan "${plan}". Must be monthly or yearly.` });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found — try logging out and back in' });
    }

    // Receipt must be under 40 characters
    const receipt = `r_${user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount:   PLANS[plan].amount,
      currency: PLANS[plan].currency,
      receipt,
      notes: {
        userId:    user._id.toString(),
        plan,
        userEmail: user.email,
      },
    });

    // Billing period
    const billingPeriodStart = new Date();
    const billingPeriodEnd   = getNextBillingDate(plan);

    // Charity contribution amount
    const charityContribution = calcCharityContribution(
      PLANS[plan].amount,
      user.charityPercentage || 10
    );

    // Create payment record — status 'created' until verified
    await Payment.create({
      userId:             user._id,
      type:               'subscription',
      plan,
      razorpayOrderId:    order.id,
      amount:             PLANS[plan].amount,
      currency:           'INR',
      status:             'created',
      charityId:          user.selectedCharity || null,
      charityContribution,
      billingPeriodStart,
      billingPeriodEnd,
    });

    // Save order ID to user document
    await User.findByIdAndUpdate(user._id, {
      'subscription.razorpayOrderId': order.id,
      'subscription.plan':            plan,
    });

    return res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    return res.status(500).json({ message: 'Could not create order', error: err.message });
  }
}


// ════════════════════════════════════════════════════════
//  VERIFY PAYMENT
// ════════════════════════════════════════════════════════
async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment fields' });
    }

    // Recreate expected signature and compare
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status:        'failed',
          failureReason: 'Signature mismatch — possible tampered request',
        }
      );
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    // Signature valid — update payment record to paid
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            'paid',
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Activate the user subscription
    const user = await User.findByIdAndUpdate(
      payment.userId,
      {
        'subscription.status':            'active',
        'subscription.plan':              payment.plan,
        'subscription.razorpayPaymentId': razorpay_payment_id,
        'subscription.currentPeriodEnd':  payment.billingPeriodEnd,
      },
      { new: true }
    );

    return res.json({
      message:      'Subscription activated successfully',
      subscription: user.subscription,
      payment: {
        id:                  payment._id,
        amount:              payment.amount / 100,
        plan:                payment.plan,
        status:              payment.status,
        charityContribution: payment.charityContribution,
        billingPeriodEnd:    payment.billingPeriodEnd,
      },
    });

  } catch (err) {
    console.error('VERIFY PAYMENT ERROR:', err);
    return res.status(500).json({ message: 'Verification error', error: err.message });
  }
}


// ════════════════════════════════════════════════════════
//  WEBHOOK
// ════════════════════════════════════════════════════════
async function webhookController(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSig   = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not set in .env');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // Verify signature — req.body must be raw buffer here
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (expectedSig !== receivedSig) {
      console.warn('Webhook signature mismatch — possible spoofed request');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    // Safe to parse now
    const event = JSON.parse(req.body);
    console.log('Webhook received:', event.event);

    // ── Renewal succeeded ──────────────────────────────
    if (event.event === 'subscription.charged') {
      const paymentId = event.payload.payment.entity.id;
      const orderId   = event.payload.payment.entity.order_id;
      const subId     = event.payload.subscription.entity.id;
      const amount    = event.payload.payment.entity.amount;

      const user = await User.findOne({
        'subscription.razorpaySubscriptionId': subId,
      });

      if (user) {
        const billingPeriodEnd = getNextBillingDate(user.subscription.plan);
        const charityContrib   = calcCharityContribution(amount, user.charityPercentage);

        // Record the renewal as a new payment
        await Payment.create({
          userId:             user._id,
          type:               'subscription',
          plan:               user.subscription.plan,
          razorpayOrderId:    orderId   || `renewal_${Date.now()}`,
          razorpayPaymentId:  paymentId,
          amount,
          currency:           'INR',
          status:             'paid',
          charityId:          user.selectedCharity || null,
          charityContribution:charityContrib,
          billingPeriodStart: new Date(),
          billingPeriodEnd,
        });

        await User.findByIdAndUpdate(user._id, {
          'subscription.status':            'active',
          'subscription.razorpayPaymentId': paymentId,
          'subscription.currentPeriodEnd':  billingPeriodEnd,
        });

        console.log(`Renewal recorded for user ${user._id}`);
      } else {
        console.warn(`No user found for subscription ${subId}`);
      }
    }

    // ── Subscription cancelled ─────────────────────────
    if (event.event === 'subscription.cancelled') {
      const subId = event.payload.subscription.entity.id;

      await User.findOneAndUpdate(
        { 'subscription.razorpaySubscriptionId': subId },
        { 'subscription.status': 'cancelled' }
      );

      console.log(`Subscription cancelled: ${subId}`);
    }

    // ── Payment failed on renewal ──────────────────────
    if (event.event === 'subscription.halted') {
      const subId  = event.payload.subscription.entity.id;
      const reason = event.payload.subscription.entity.failure_reason || 'Payment failed';

      const user = await User.findOneAndUpdate(
        { 'subscription.razorpaySubscriptionId': subId },
        { 'subscription.status': 'lapsed' },
        { new: true }
      );

      // Record the failed payment
      if (user) {
        await Payment.create({
          userId:          user._id,
          type:            'subscription',
          plan:            user.subscription.plan,
          razorpayOrderId: `halted_${subId}_${Date.now()}`,
          amount:          0,
          status:          'failed',
          failureReason:   reason,
        });
      }

      console.log(`Subscription halted: ${subId} — ${reason}`);
    }

    // ── Payment captured (one-time) ────────────────────
    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const orderId   = event.payload.payment.entity.order_id;

      // Update any 'created' payment record matching this order
      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'created' },
        {
          razorpayPaymentId: paymentId,
          status:            'paid',
        }
      );
    }

    // ── Refund processed ──────────────────────────────
    if (event.event === 'refund.processed') {
      const paymentId = event.payload.refund.entity.payment_id;

      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentId },
        { status: 'refunded' }
      );

      console.log(`Refund processed for payment ${paymentId}`);
    }

    return res.json({ received: true });

  } catch (err) {
    console.error('WEBHOOK ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
}


// ════════════════════════════════════════════════════════
//  GET MY PAYMENTS
// ════════════════════════════════════════════════════════
async function getMyPayments(req, res) {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .populate('charityId', 'name')
      .sort({ createdAt: -1 });

    const formatted = payments.map(p => ({
      id:                  p._id,
      type:                p.type,
      plan:                p.plan,
      amount:              p.amount / 100,
      currency:            p.currency,
      status:              p.status,
      charity:             p.charityId?.name || null,
      charityContribution: p.charityContribution,
      billingPeriodStart:  p.billingPeriodStart,
      billingPeriodEnd:    p.billingPeriodEnd,
      failureReason:       p.failureReason,
      createdAt:           p.createdAt,
    }));

    return res.json({ payments: formatted });

  } catch (err) {
    console.error('GET MY PAYMENTS ERROR:', err);
    return res.status(500).json({ message: 'Could not fetch payments', error: err.message });
  }
}


module.exports = {
  createOrder,
  verifyPayment,
  webhookController,
  getMyPayments,
};