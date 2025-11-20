const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const myLogModule = require('../utils/logger');

/**
 * @swagger
 * /stats/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OverviewStats'
 */
// Dashboard Overview Stats
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalProperties = await Property.countDocuments({ userId });
    const totalTenants = await Tenant.countDocuments({
      propertyId: { $in: await Property.find({ userId }).distinct('_id') }
    });

    const tenants = await Tenant.find({
      propertyId: { $in: await Property.find({ userId }).distinct('_id') }
    }).populate('propertyId');

    let pendingRent = 0;
    let pendingMaintenance = 0;
    let pendingLightBill = 0;

    tenants.forEach(tenant => {
      if (tenant.rentStatus === 'pending') {
        pendingRent += tenant.propertyId.monthlyRent || 0;
      }
      if (tenant.maintenanceStatus === 'pending') {
        pendingMaintenance += tenant.propertyId.maintenance || 0;
      }
      if (tenant.lightBillStatus === 'pending') {
        pendingLightBill += tenant.propertyId.lightBill || 0;
      }
    });

    res.json({
      success: true,
      data: {
        totalProperties,
        totalTenants,
        pendingRent,
        pendingMaintenance,
        pendingLightBill
      }
    });
  } catch (error) {
    myLogModule.error('Get overview stats error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching overview stats', details: error.message });
  }
};

/**
 * @swagger
 * /stats/monthly:
 *   get:
 *     summary: Get monthly statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           default: 2024
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Monthly statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MonthlyStats'
 */
// Monthly Stats
exports.getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const properties = await Property.find({ userId });
    const propertyIds = properties.map(p => p._id);
    const tenants = await Tenant.find({ propertyId: { $in: propertyIds } }).populate('propertyId');

    const monthlyData = {
      rent: { collected: 0, pending: 0 },
      maintenance: { collected: 0, pending: 0 },
      lightBill: { collected: 0, pending: 0 }
    };

    tenants.forEach(tenant => {
      const rent = tenant.propertyId.monthlyRent || 0;
      const maintenance = tenant.propertyId.maintenance || 0;
      const lightBill = tenant.propertyId.lightBill || 0;

      if (tenant.rentStatus === 'paid') {
        monthlyData.rent.collected += rent;
      } else {
        monthlyData.rent.pending += rent;
      }

      if (tenant.maintenanceStatus === 'paid') {
        monthlyData.maintenance.collected += maintenance;
      } else {
        monthlyData.maintenance.pending += maintenance;
      }

      if (tenant.lightBillStatus === 'paid') {
        monthlyData.lightBill.collected += lightBill;
      } else {
        monthlyData.lightBill.pending += lightBill;
      }
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        ...monthlyData
      }
    });
  } catch (error) {
    myLogModule.error('Get monthly stats error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching monthly stats', details: error.message });
  }
};

/**
 * @swagger
 * /stats/yearly:
 *   get:
 *     summary: Get yearly statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           default: 2024
 *     responses:
 *       200:
 *         description: Yearly statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/YearlyStats'
 */
// Yearly Stats
exports.getYearlyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear() } = req.query;

    const properties = await Property.find({ userId });
    const propertyIds = properties.map(p => p._id);
    const tenants = await Tenant.find({ propertyId: { $in: propertyIds } }).populate('propertyId');

    let totalCollection = 0;
    const monthlyBreakdown = {};

    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      monthlyBreakdown[i] = {
        rent: 0,
        maintenance: 0,
        lightBill: 0,
        total: 0
      };
    }

    tenants.forEach(tenant => {
      const rent = tenant.propertyId.monthlyRent || 0;
      const maintenance = tenant.propertyId.maintenance || 0;
      const lightBill = tenant.propertyId.lightBill || 0;

      // For simplicity, we'll calculate based on current status
      // In a real app, you'd track monthly payments
      const currentMonth = new Date().getMonth() + 1;
      
      if (tenant.rentStatus === 'paid') {
        monthlyBreakdown[currentMonth].rent += rent;
        totalCollection += rent;
      }
      if (tenant.maintenanceStatus === 'paid') {
        monthlyBreakdown[currentMonth].maintenance += maintenance;
        totalCollection += maintenance;
      }
      if (tenant.lightBillStatus === 'paid') {
        monthlyBreakdown[currentMonth].lightBill += lightBill;
        totalCollection += lightBill;
      }

      monthlyBreakdown[currentMonth].total = 
        monthlyBreakdown[currentMonth].rent + 
        monthlyBreakdown[currentMonth].maintenance + 
        monthlyBreakdown[currentMonth].lightBill;
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        totalCollection,
        monthlyBreakdown
      }
    });
  } catch (error) {
    myLogModule.error('Get yearly stats error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching yearly stats', details: error.message });
  }
};

