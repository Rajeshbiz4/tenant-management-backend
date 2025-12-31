const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const myLogModule = require('../utils/logger');

/**
 * CREATE TENANT
 */
exports.createTenant = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { propertyId } = req.params;
    const { name, phone, email, aadhar, startDate, leaseId , advance } = req.body;
    const userId = req.user.userId;

    if (!name || !phone || !email || !aadhar || !startDate || !leaseId || !advance) {
      return res.status(400).json({
        error: true,
        message: 'All tenant fields are required'
      });
    }

    const property = await Property.findOne({ _id: propertyId, userId });
    if (!property) {
      return res.status(404).json({
        error: true,
        message: 'Property not found'
      });
    }

    if (property.tenant) {
      return res.status(400).json({
        error: true,
        message: 'Property already has a tenant'
      });
    }

    const tenant = await Tenant.create({
      name,
      phone,
      email,
      aadhar,
      startDate,
      propertyId,
      leaseId,
      advance
    });

    await Property.findByIdAndUpdate(propertyId, {
      $set: { tenant: tenant._id }
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant
    });

  } catch (error) {
    myLogModule.error('Create tenant error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error creating tenant',
      details: error.message
    });
  }
};


/**
 * GET ALL TENANTS (PAGINATED)
 */
exports.getAllTenants = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const properties = await Property.find({ userId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const skip = (page - 1) * limit;

    const tenants = await Tenant.find({
      propertyId: { $in: propertyIds },
      isDeleted: false
    })
      .populate('propertyId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Tenant.countDocuments({
      propertyId: { $in: propertyIds },
      isDeleted: false
    });

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    myLogModule.error('Get tenants error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error fetching tenants',
      details: error.message
    });
  }
};


/**
 * UPDATE TENANT (PARTIAL)
 */
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, phone, email, isVerified } = req.body;

    const tenant = await Tenant.findOne({
      _id: id,
      isDeleted: false
    }).populate('propertyId');

    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(email && { email }),
          ...(typeof isVerified === 'boolean' && { isVerified })
        }
      },
      { new: true, runValidators: false }
    );

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant
    });

  } catch (error) {
    myLogModule.error('Update tenant error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error updating tenant',
      details: error.message
    });
  }
};


/**
 * SOFT DELETE TENANT
 */
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tenant = await Tenant.findOne({
      _id: id,
      isDeleted: false
    }).populate('propertyId');

    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    await Property.findByIdAndUpdate(
      tenant.propertyId._id,
      { $unset: { tenant: 1 } }
    );

    await Tenant.findByIdAndUpdate(id, {
      $set: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });

  } catch (error) {
    myLogModule.error('Delete tenant error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error deleting tenant',
      details: error.message
    });
  }
};


/**
 * UPDATE RENT STATUS
 */
exports.updateRentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rentStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(rentStatus)) {
      return res.status(400).json({ error: true, message: 'Invalid rent status' });
    }

    const tenant = await Tenant.findOne({ _id: id, isDeleted: false }).populate('propertyId');
    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    const updated = await Tenant.findByIdAndUpdate(
      id,
      { $set: { rentStatus } },
      { new: true }
    );

    res.json({ success: true, message: 'Rent status updated', data: updated });

  } catch (error) {
    myLogModule.error('Update rent status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating rent status' });
  }
};


/**
 * UPDATE MAINTENANCE STATUS
 */
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenanceStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(maintenanceStatus)) {
      return res.status(400).json({ error: true, message: 'Invalid maintenance status' });
    }

    const tenant = await Tenant.findOne({ _id: id, isDeleted: false }).populate('propertyId');
    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    const updated = await Tenant.findByIdAndUpdate(
      id,
      { $set: { maintenanceStatus } },
      { new: true }
    );

    res.json({ success: true, message: 'Maintenance status updated', data: updated });

  } catch (error) {
    myLogModule.error('Update maintenance status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating maintenance status' });
  }
};


/**
 * UPDATE LIGHT BILL STATUS
 */
exports.updateLightBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { lightBillStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(lightBillStatus)) {
      return res.status(400).json({ error: true, message: 'Invalid light bill status' });
    }

    const tenant = await Tenant.findOne({ _id: id, isDeleted: false }).populate('propertyId');
    if (!tenant) return res.status(404).json({ error: true, message: 'Tenant not found' });

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    const updated = await Tenant.findByIdAndUpdate(
      id,
      { $set: { lightBillStatus } },
      { new: true }
    );

    res.json({ success: true, message: 'Light bill status updated', data: updated });

  } catch (error) {
    myLogModule.error('Update light bill status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating light bill status' });
  }
};
