const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },

  subscription: {
    status:              { type: String, enum: ['active', 'inactive', 'cancelled', 'lapsed'], default: 'inactive' },
    plan:                { type: String, enum: ['monthly', 'yearly'], default: null },
    razorpayOrderId:     { type: String, default: null },  // created on your backend
    razorpayPaymentId:   { type: String, default: null },  // returned after payment
    razorpaySubscriptionId: { type: String, default: null }, // for recurring billing
    currentPeriodEnd:    { type: Date, default: null },
  },

  selectedCharity:    { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
  charityPercentage:  { type: Number, default: 10, min: 10, max: 100 },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);