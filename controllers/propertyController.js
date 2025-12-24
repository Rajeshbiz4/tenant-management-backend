const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const myLogModule = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Agreement:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *         months:
 *           type: number
 *
 *     Rent:
 *       type: object
 *       properties:
 *         monthlyRent:
 *           type: number
 *         maintenance:
 *           type: number
 *         lastPaid:
 *           type: string
 *           format: date
 *
 *     Electricity:
 *       type: object
 *       properties:
 *         submeterNo:
 *           type: string
 *         lastUnit:
 *           type: number
 *         unitRate:
 *           type: number
 *
 *     PropertyRequest:
 *       type: object
 *       required:
 *         - propertyType
 *         - shopName
 *         - shopNumber
 *         - area
 *         - location
 *       properties:
 *         propertyType:
 *           type: string
 *           enum: [flat, shop, plot]
 *         shopName:
 *           type: string
 *         shopNumber:
 *           type: string
 *         area:
 *           type: string
 *         location:
 *           type: string
 *         agreement:
 *           $ref: "#/components/schemas/Agreement"
 *         rent:
 *           $ref: "#/components/schemas/Rent"
 *         electricity:
 *           $ref: "#/components/schemas/Electricity"
 *         isActive:
 *           type: boolean
 *
 *     Property:
 *       allOf:
 *         - $ref: "#/components/schemas/PropertyRequest"
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             userId:
 *               type: string
 *             createdAt:
 *               type: string
 *             updatedAt:
 *               type: string
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: number
 *         limit:
 *           type: number
 *         total:
 *           type: number
 *         totalPages:
 *           type: number
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: boolean
 *         message:
 *           type: string
 *
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */

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
 *       400:
 *         description: Missing required fields
 */

// -------------------------------------
// Create Property
// -------------------------------------
exports.createProperty = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      propertyType,
      shopName,
      shopNumber,
      area,
      location,
      agreement,
      rent,
      electricity,
      isActive
    } = req.body;

    if (!propertyType || !shopName || !shopNumber || !area || !location) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields'
      });
    }

    const property = new Property({
      propertyType,
      shopName,
      shopNumber,
      area,
      location,
      agreement,
      rent,
      electricity,
      isActive,
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
    res.status(500).json({
      error: true,
      message: 'Error creating property',
      details: error.message
    });
  }
};

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties with pagination & search
 *     tags: [Property]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by location
 *       - name: propertyType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [flat, shop, plot]
 *     responses:
 *       200:
 *         description: Property list fetched
 */

// -------------------------------------
// Get All Properties
// -------------------------------------
exports.getAllProperties = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, search, propertyType } = req.query;

    const filter = { userId };

    if (search) filter.location = { $regex: search, $options: 'i' };
    if (propertyType) filter.propertyType = propertyType;

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
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    myLogModule.error('Get properties error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error fetching properties',
      details: error.message
    });
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 */

// -------------------------------------
// Get Single Property
// -------------------------------------
exports.getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await Property.findOne({ _id: id, userId })
      .populate('tenant');

    if (!property) {
      return res.status(404).json({
        error: true,
        message: 'Property not found'
      });
    }

    res.json({ success: true, data: property });

  } catch (error) {
    myLogModule.error('Get property error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error fetching property',
      details: error.message
    });
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
 *       - name: id
 *         in: path
 *         required: true
 */

// -------------------------------------
// Update Property
// -------------------------------------
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const data = req.body;

    const property = await Property.findOne({ _id: id, userId });
    if (!property) {
      return res.status(404).json({
        error: true,
        message: 'Property not found'
      });
    }

    Object.assign(property, data);
    await property.save();

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });

  } catch (error) {
    myLogModule.error('Update property error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Error updating property',
      details: error.message
    });
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
 *       - name: id
 *         in: path
 *         required: true
 */

// -------------------------------------
// Delete Property
// -------------------------------------
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await Property.findOne({ _id: id, userId });
    if (!property) {
      return res.status(404).json({
        error: true,
        message: 'Property not found'
      });
    }

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
    res.status(500).json({
      error: true,
      message: 'Error deleting property',
      details: error.message
    });
  }
};
