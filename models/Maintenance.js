const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  maintainer: {
    type: String,
    required: true,
    trim: true
  },
  activityDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
maintenanceSchema.index({ property: 1, activityDate: -1 });
maintenanceSchema.index({ userId: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);

