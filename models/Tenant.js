const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
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

    // Tenant start date
    startDate: {
      type: Date,
      required: true
    },

    // Advance amount (> 0)
    advance: {
      type: Number,
      required: true,
      min: [1, 'Advance amount must be greater than 0']
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },

    leaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lease',
      required: true,
      index: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto exclude deleted tenants
tenantSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);
