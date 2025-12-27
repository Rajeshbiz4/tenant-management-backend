const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  months: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const rentSchema = new mongoose.Schema({
  monthlyRent: {
    type: Number,
    required: true,
    min: 0
  },
  maintenance: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPaid: {
    type: Date
  }
}, { _id: false });

const electricitySchema = new mongoose.Schema({
  submeterNo: {
    type: String,
    trim: true
  },
  lastUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  unitRate: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const propertySchema = new mongoose.Schema({
  propertyType: {
    type: String,
    required: true,
    enum: ['flat', 'shop', 'plot']
  },

  shopName: {
    type: String,
    required: true,
    trim: true
  },

  shopNumber: {
    type: String,
    required: true
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

  agreement: agreementSchema,

  rent: rentSchema,

  electricity: electricitySchema,

  isActive: {
    type: Boolean,
    default: true
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
