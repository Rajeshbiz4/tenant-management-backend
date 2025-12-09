const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const myLogModule = require('../utils/logger');

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyRequest'
 *     responses:
 *       201:
 *         description: Property created successfully
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
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create Property
exports.createProperty = async (req, res) => {
  try {
    const { propertyType, shopName, shopNumber, area, location, monthlyRent, maintenance, lightBill } = req.body;
    const userId = req.user.userId;

    if (!propertyType || !area || !location || !monthlyRent || !shopName || !shopNumber) {
      return res.status(400).json({ error: true, message: 'Property type, area, location, and monthly rent are required' });
    }

    if (!['flat', 'shop', 'plot'].includes(propertyType)) {
      return res.status(400).json({ error: true, message: 'Property type must be flat, shop, or plot' });
    }

    const property = new Property({
      propertyType,
      area,
      shopName,
      shopNumber,
      location,
      monthlyRent,
      maintenance: maintenance || 0,
      lightBill: lightBill || 0,
      userId
    });

    await property.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    myLogModule.error('Create property error: ' + error);
    res.status(500).json({ error: true, message: 'Error creating property', details: error.message });
  }
};

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties with pagination and filters
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by location
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *           enum: [flat, shop, plot]
 *         description: Filter by property type
 *     responses:
 *       200:
 *         description: List of properties
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
 *                     $ref: '#/components/schemas/Property'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
// Get All Properties
exports.getAllProperties = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, search, propertyType } = req.query;

    const filter = { userId };
    if (search) {
      filter.location = { $regex: search, $options: 'i' };
    }
    if (propertyType) {
      filter.propertyType = propertyType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const properties = await Property.find(filter)
      .populate('tenant')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    myLogModule.error('Get properties error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching properties', details: error.message });
  }
};

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get a single property by ID
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get Single Property
exports.getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await Property.findOne({ _id: id, userId }).populate('tenant');
    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    myLogModule.error('Get property error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching property', details: error.message });
  }
};

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Update a property
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyRequest'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update Property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { propertyType, area, location, monthlyRent, maintenance, lightBill } = req.body;

    const property = await Property.findOne({ _id: id, userId });
    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    if (propertyType) property.propertyType = propertyType;
    if (area !== undefined) property.area = area;
    if (location) property.location = location;
    if (monthlyRent !== undefined) property.monthlyRent = monthlyRent;
    if (maintenance !== undefined) property.maintenance = maintenance;
    if (lightBill !== undefined) property.lightBill = lightBill;

    await property.save();

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    myLogModule.error('Update property error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating property', details: error.message });
  }
};

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Delete a property
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Delete Property
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await Property.findOne({ _id: id, userId });
    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    // Delete associated tenant if exists
    if (property.tenant) {
      await Tenant.findByIdAndDelete(property.tenant);
    }

    await Property.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    myLogModule.error('Delete property error: ' + error);
    res.status(500).json({ error: true, message: 'Error deleting property', details: error.message });
  }
};

