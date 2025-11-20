const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  aadhar: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    unique: true
  },
  rentStatus: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  },
  maintenanceStatus: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  },
  lightBillStatus: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);

