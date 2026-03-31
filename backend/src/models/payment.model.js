const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // What this payment was for
  type: {
    type: String,
    enum: ['subscription', 'donation'],
    required: true,
  },

  plan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null, // null for donations
  },

  // Razorpay identifiers
  razorpayOrderId:   { type: String, required: true },
  razorpayPaymentId: { type: String, default: null }, // filled after payment succeeds
  razorpaySignature: { type: String, default: null }, // filled after verification

  // Amount in paise (divide by 100 for rupees)
  amount:   { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
    // created  → order exists, user hasn't paid yet
    // paid     → payment verified successfully
    // failed   → payment failed or was rejected
    // refunded → admin issued a refund
  },

  // Charity details (for donation type)
  charityId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
  charityContribution:{ type: Number, default: 0 }, // how much of this payment goes to charity

  // Billing period (for subscription type)
  billingPeriodStart: { type: Date, default: null },
  billingPeriodEnd:   { type: Date, default: null },

  // Failure reason if payment failed
  failureReason: { type: String, default: null },

}, { timestamps: true }); // createdAt = when order was created, updatedAt = when status changed

// Index for fast lookups
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

module.exports = mongoose.model('paymentModel', paymentSchema);