const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyType: {
    type: String,
    required: true,
    enum: ['flat', 'shop', 'plot']
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  monthlyRent: {
    type: Number,
    required: true,
    min: 0
  },
  shopName: {
    type: String,
    required: true,
     trim: true
  },
  shopNumber: {
    type: Number,
    required: true,
    min: 0
  },
  maintenance: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lightBill: {
    type: Number,
    min: 0,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);

