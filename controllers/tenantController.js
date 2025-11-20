const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const myLogModule = require('../utils/logger');

/**
 * @swagger
 * /tenant/properties/{propertyId}/tenant:
 *   post:
 *     summary: Create a tenant for a property
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TenantRequest'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error or property already has tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create Tenant for Property
exports.createTenant = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { name, phone, email, aadhar, startDate } = req.body;
    const userId = req.user.userId;

    if (!name || !phone || !email || !aadhar || !startDate) {
      return res.status(400).json({ error: true, message: 'All tenant fields are required' });
    }

    // Check if property exists and belongs to user
    const property = await Property.findOne({ _id: propertyId, userId });
    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    // Check if property already has a tenant
    if (property.tenant) {
      return res.status(400).json({ error: true, message: 'Property already has a tenant' });
    }

    const tenant = new Tenant({
      name,
      phone,
      email,
      aadhar,
      startDate,
      propertyId
    });

    await tenant.save();

    // Update property with tenant reference
    property.tenant = tenant._id;
    await property.save();

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant
    });
  } catch (error) {
    myLogModule.error('Create tenant error: ' + error);
    res.status(500).json({ error: true, message: 'Error creating tenant', details: error.message });
  }
};

/**
 * @swagger
 * /tenant:
 *   get:
 *     summary: Get all tenants with pagination
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
// Get All Tenants
exports.getAllTenants = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    // Get all properties of user
    const properties = await Property.find({ userId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tenants = await Tenant.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Tenant.countDocuments({ propertyId: { $in: propertyIds } });

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    myLogModule.error('Get tenants error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching tenants', details: error.message });
  }
};

/**
 * @swagger
 * /tenant/{tenantId}:
 *   put:
 *     summary: Update tenant information
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TenantRequest'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Update Tenant
exports.updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.userId;
    const { name, phone, email, aadhar, startDate } = req.body;

    const tenant = await Tenant.findById(tenantId).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    // Verify property belongs to user
    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    if (name) tenant.name = name;
    if (phone) tenant.phone = phone;
    if (email) tenant.email = email;
    if (aadhar) tenant.aadhar = aadhar;
    if (startDate) tenant.startDate = startDate;

    await tenant.save();

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    myLogModule.error('Update tenant error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating tenant', details: error.message });
  }
};

/**
 * @swagger
 * /tenant/{tenantId}:
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Delete Tenant
exports.deleteTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.userId;

    const tenant = await Tenant.findById(tenantId).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    // Verify property belongs to user
    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    // Remove tenant reference from property
    await Property.findByIdAndUpdate(tenant.propertyId._id, { $unset: { tenant: 1 } });

    await Tenant.findByIdAndDelete(tenantId);

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    myLogModule.error('Delete tenant error: ' + error);
    res.status(500).json({ error: true, message: 'Error deleting tenant', details: error.message });
  }
};

/**
 * @swagger
 * /tenant/{id}/rent-status:
 *   put:
 *     summary: Update rent payment status
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rentStatus
 *             properties:
 *               rentStatus:
 *                 type: string
 *                 enum: [paid, pending]
 *     responses:
 *       200:
 *         description: Rent status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Update Rent Status
exports.updateRentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rentStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(rentStatus)) {
      return res.status(400).json({ error: true, message: 'Rent status must be paid or pending' });
    }

    const tenant = await Tenant.findById(id).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    tenant.rentStatus = rentStatus;
    await tenant.save();

    res.json({
      success: true,
      message: 'Rent status updated successfully',
      data: tenant
    });
  } catch (error) {
    myLogModule.error('Update rent status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating rent status', details: error.message });
  }
};

/**
 * @swagger
 * /tenant/{id}/maintenance-status:
 *   put:
 *     summary: Update maintenance payment status
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceStatus
 *             properties:
 *               maintenanceStatus:
 *                 type: string
 *                 enum: [paid, pending]
 *     responses:
 *       200:
 *         description: Maintenance status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Update Maintenance Status
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenanceStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(maintenanceStatus)) {
      return res.status(400).json({ error: true, message: 'Maintenance status must be paid or pending' });
    }

    const tenant = await Tenant.findById(id).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    tenant.maintenanceStatus = maintenanceStatus;
    await tenant.save();

    res.json({
      success: true,
      message: 'Maintenance status updated successfully',
      data: tenant
    });
  } catch (error) {
    myLogModule.error('Update maintenance status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating maintenance status', details: error.message });
  }
};

/**
 * @swagger
 * /tenant/{id}/lightbill-status:
 *   put:
 *     summary: Update light bill payment status
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lightBillStatus
 *             properties:
 *               lightBillStatus:
 *                 type: string
 *                 enum: [paid, pending]
 *     responses:
 *       200:
 *         description: Light bill status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Update Light Bill Status
exports.updateLightBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { lightBillStatus } = req.body;
    const userId = req.user.userId;

    if (!['paid', 'pending'].includes(lightBillStatus)) {
      return res.status(400).json({ error: true, message: 'Light bill status must be paid or pending' });
    }

    const tenant = await Tenant.findById(id).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: true, message: 'Tenant not found' });
    }

    if (tenant.propertyId.userId.toString() !== userId) {
      return res.status(403).json({ error: true, message: 'Unauthorized' });
    }

    tenant.lightBillStatus = lightBillStatus;
    await tenant.save();

    res.json({
      success: true,
      message: 'Light bill status updated successfully',
      data: tenant
    });
  } catch (error) {
    myLogModule.error('Update light bill status error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating light bill status', details: error.message });
  }
};

