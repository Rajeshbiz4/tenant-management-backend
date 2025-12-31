const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: {
    type: String,
    enum: ['rent', 'maintenance', 'light', 'advance'],
    required: true,
  },
  rentMonth: { type: Number, min: 1, max: 12 }, // 1-12 for Jan-Dec
  amount: { type: Number, required: true },
  paidOn: { type: Date, required: true, default: Date.now },
  month: { type: Number, min: 1, max: 12 }, // optional, useful for monthly reports
  year: { type: Number }, // optional
  isPartial: { type: Boolean, default: false },
  remainingAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
