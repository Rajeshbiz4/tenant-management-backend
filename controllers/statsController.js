const mongoose = require('mongoose');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
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
      if (!tenant.propertyId) return;
      
      const property = tenant.propertyId;
      const rentAmount = property.rent?.monthlyRent || property.monthlyRent || 0;
      const maintenanceAmount = property.rent?.maintenance || property.maintenance || 0;
      const lightBillAmount = property.electricity?.lastUnit && property.electricity?.unitRate
        ? property.electricity.lastUnit * property.electricity.unitRate
        : property.lightBill || 0;
      
      if (tenant.rentStatus === 'pending') {
        pendingRent += rentAmount;
      }
      if (tenant.maintenanceStatus === 'pending') {
        pendingMaintenance += maintenanceAmount;
      }
      if (tenant.lightBillStatus === 'pending') {
        pendingLightBill += lightBillAmount;
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
      if (!tenant.propertyId) return;
      
      const property = tenant.propertyId;
      const rent = property.rent?.monthlyRent || property.monthlyRent || 0;
      const maintenance = property.rent?.maintenance || property.maintenance || 0;
      const lightBill = property.electricity?.lastUnit && property.electricity?.unitRate
        ? property.electricity.lastUnit * property.electricity.unitRate
        : property.lightBill || 0;

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
      if (!tenant.propertyId) return;
      
      const property = tenant.propertyId;
      const rent = property.rent?.monthlyRent || property.monthlyRent || 0;
      const maintenance = property.rent?.maintenance || property.maintenance || 0;
      const lightBill = property.electricity?.lastUnit && property.electricity?.unitRate
        ? property.electricity.lastUnit * property.electricity.unitRate
        : property.lightBill || 0;

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

/**
 * @swagger
 * /stats/analytics:
 *   get:
 *     summary: Get analytics data (earnings, spends, pending rent)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data
 */
// Analytics Stats - Earnings, Spends, Pending Rent
exports.getAnalytics = async (req, res) => {
  try {
    console.log('Analytics API called with query:', req.query);
    console.log('User ID:', req.user.userId);
    
    const userId = req.user.userId;
    const { year, month, propertyId } = req.query;

    // Get user's properties
    const properties = await Property.find({ userId });
    const propertyIds = properties.map(p => p._id.toString());
    
    console.log('Found properties:', properties.length, 'Property IDs:', propertyIds);

    // If no properties, return empty analytics
    if (propertyIds.length === 0) {
      const currentDate = new Date();
      const currentYear = year ? parseInt(year) : currentDate.getFullYear();
      const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      
      return res.json({
        success: true,
        data: {
          period: {
            year: currentYear,
            month: currentMonth,
            monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' })
          },
          earnings: {
            total: 0,
            byType: { rent: 0, maintenance: 0, light: 0, advance: 0 },
            count: 0
          },
          spends: {
            total: 0,
            paid: 0,
            pending: 0,
            count: 0
          },
          pendingRent: {
            total: 0,
            count: 0,
            details: []
          },
          netAmount: 0,
          profitMargin: 0
        }
      });
    }

    // Build filters
    const paymentFilter = { 
      property: { $in: propertyIds.map(id => new mongoose.Types.ObjectId(id)) }
    };
    const maintenanceFilter = { 
      property: { $in: propertyIds.map(id => new mongoose.Types.ObjectId(id)) }
    };

    if (propertyId && propertyIds.includes(propertyId)) {
      paymentFilter.property = new mongoose.Types.ObjectId(propertyId);
      maintenanceFilter.property = new mongoose.Types.ObjectId(propertyId);
    }

    // Set default to current month if no year/month specified
    const currentDate = new Date();
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Filter by year/month for payments
    paymentFilter.year = currentYear;
    if (month) {
      paymentFilter.month = currentMonth;
    }

    // Filter by year/month for maintenance (using activityDate)
    const startDate = new Date(currentYear, month ? currentMonth - 1 : 0, 1);
    const endDate = month 
      ? new Date(currentYear, currentMonth, 0, 23, 59, 59)
      : new Date(currentYear, 12, 0, 23, 59, 59);
    maintenanceFilter.activityDate = { $gte: startDate, $lte: endDate };

    // Calculate Total Earnings from Payments
    const payments = await Payment.find(paymentFilter);
    const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Breakdown by type
    const earningsByType = {
      rent: payments.filter(p => p.type === 'rent').reduce((sum, p) => sum + (p.amount || 0), 0),
      maintenance: payments.filter(p => p.type === 'maintenance').reduce((sum, p) => sum + (p.amount || 0), 0),
      light: payments.filter(p => p.type === 'light').reduce((sum, p) => sum + (p.amount || 0), 0),
      advance: payments.filter(p => p.type === 'advance').reduce((sum, p) => sum + (p.amount || 0), 0),
    };

    // Calculate Total Spends from Maintenance
    const maintenanceRecords = await Maintenance.find(maintenanceFilter);
    const totalSpends = maintenanceRecords.reduce((sum, m) => sum + (m.amount || 0), 0);
    const paidSpends = maintenanceRecords
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const pendingSpends = maintenanceRecords
      .filter(m => m.status === 'pending')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Calculate Pending Rent for Current Month
    const tenants = await Tenant.find({
      propertyId: { $in: propertyIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).populate('propertyId');

    let pendingRentCurrentMonth = 0;
    const pendingRentDetails = [];

    tenants.forEach(tenant => {
      if (tenant.rentStatus === 'pending' && tenant.propertyId) {
        const rentAmount = tenant.propertyId.monthlyRent || tenant.propertyId.rent?.monthlyRent || 0;
        pendingRentCurrentMonth += rentAmount;
        pendingRentDetails.push({
          property: tenant.propertyId.shopName || 'N/A',
          propertyNumber: tenant.propertyId.shopNumber || 'N/A',
          tenant: tenant.name || 'N/A',
          amount: rentAmount
        });
      }
    });

    // Net Profit/Loss
    const netAmount = totalEarnings - totalSpends;
    const profitMargin = totalEarnings > 0 ? ((netAmount / totalEarnings) * 100).toFixed(2) : 0;

    const responseData = {
      period: {
        year: currentYear,
        month: currentMonth,
        monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' })
      },
      earnings: {
        total: totalEarnings,
        byType: earningsByType,
        count: payments.length
      },
      spends: {
        total: totalSpends,
        paid: paidSpends,
        pending: pendingSpends,
        count: maintenanceRecords.length
      },
      pendingRent: {
        total: pendingRentCurrentMonth,
        count: pendingRentDetails.length,
        details: pendingRentDetails
      },
      netAmount: netAmount,
      profitMargin: parseFloat(profitMargin)
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    myLogModule.error('Get analytics error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching analytics', details: error.message });
  }
};

