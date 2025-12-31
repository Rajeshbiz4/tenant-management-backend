const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const myLogModule = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management for properties and tenants
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         property:
 *           type: string
 *         tenant:
 *           type: string
 *         type:
 *           type: string
 *         amount:
 *           type: number
 *         paidOn:
 *           type: string
 *           format: date
 *         month:
 *           type: number
 *         year:
 *           type: number
 *         isPartial:
 *           type: boolean
 *         remainingAmount:
 *           type: number
 */

/**
 * @swagger
 * /payments/make:
 *   post:
 *     summary: Make a payment (rent, maintenance, light, advance)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - tenantId
 *               - type
 *               - amount
 *             properties:
 *               propertyId:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [rent, maintenance, light, advance]
 *               amount:
 *                 type: number
 *               paidOn:
 *                 type: string
 *                 format: date
 *               isPartial:
 *                 type: boolean
 *               month:
 *                 type: number
 *               year:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Property or Tenant not found
 *       500:
 *         description: Server error
 */
exports.makePayment = async (req, res) => {
  try {
    const { propertyId, tenantId, type, amount, paidOn, isPartial, month, year } = req.body;

    const property = await Property.findById(propertyId);
    const tenant = await Tenant.findById(tenantId);

    if (!property || !tenant) {
      return res.status(404).json({
        error: true,
        message: 'Property or Tenant not found'
      });
    }

    let remainingAmount = 0;
    if (isPartial) {
      const dueAmount =
        type === 'rent'
          ? property.rent.amount
          : type === 'maintenance'
          ? property.rent.maintenance
          : type === 'light'
          ? property.electricity.lastUnit * property.electricity.unitRate
          : 0;
      remainingAmount = dueAmount - amount;
    }

    const payment = new Payment({
      property: propertyId,
      tenant: tenantId,
      type,
      amount,
      paidOn,
      month,
      year,
      isPartial: isPartial || false,
      remainingAmount,
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });

  } catch (error) {
    myLogModule.error('Make payment error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      details: error.message
    });
  }
};

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get payments with optional filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, maintenance, light, advance]
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Server error
 */
exports.getPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { propertyId, tenantId, month, year, type } = req.query;
    
    // Get user's properties to filter payments
    const userProperties = await Property.find({ userId });
    const userPropertyIds = userProperties.map(p => p._id.toString());
    
    // If user has no properties, return empty array
    if (userPropertyIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Payments fetched successfully',
        data: []
      });
    }
    
    const filter = {
      property: { $in: userProperties.map(p => p._id) } // Only payments for user's properties
    };

    if (propertyId) {
      // Check if the property belongs to the user
      if (userPropertyIds.includes(propertyId)) {
        filter.property = new mongoose.Types.ObjectId(propertyId);
      } else {
        // Property doesn't belong to user, return empty
        return res.status(200).json({
          success: true,
          message: 'Payments fetched successfully',
          data: []
        });
      }
    }
    if (tenantId) filter.tenant = tenantId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate('property', 'shopName location')
      .populate('tenant', 'name email');

    res.status(200).json({
      success: true,
      message: 'Payments fetched successfully',
      data: payments
    });

  } catch (error) {
    myLogModule.error('Get payments error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      details: error.message
    });
  }
};

/**
 * @swagger
 * /payments/report:
 *   get:
 *     summary: Get monthly/yearly/shop-wise payment report
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated report of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   property:
 *                     type: string
 *                   type:
 *                     type: string
 *                   totalAmount:
 *                     type: number
 *                   partialPayments:
 *                     type: number
 *                   count:
 *                     type: number
 *       500:
 *         description: Server error
 */
exports.getReport = async (req, res) => {
  try {
    const { year, month, propertyId } = req.query;
    const match = {};

    if (year) match.year = parseInt(year);
    if (month) match.month = parseInt(month);
    if (propertyId) match.property = propertyId;

    const report = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { property: '$property', type: '$type' },
          totalAmount: { $sum: '$amount' },
          partialPayments: { $sum: { $cond: ['$isPartial', 1, 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id.property',
          foreignField: '_id',
          as: 'property',
        },
      },
      { $unwind: '$property' },
      {
        $project: {
          property: '$property.shopName',
          type: '$_id.type',
          totalAmount: 1,
          partialPayments: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: report
    });

  } catch (error) {
    myLogModule.error('Get report error: ' + error);
    res.status(500).json({
      error: true,
      message: 'Server error',
      details: error.message
    });
  }
};
