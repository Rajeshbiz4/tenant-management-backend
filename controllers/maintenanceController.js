const Maintenance = require('../models/Maintenance');
const Property = require('../models/Property');
const myLogModule = require('../utils/logger');

/**
 * CREATE MAINTENANCE RECORD
 */
exports.createMaintenance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { property, maintainer, activityDate, paidDate, amount, description, status } = req.body;

    // Validate property exists and belongs to user
    const propertyDoc = await Property.findOne({ _id: property, userId });
    if (!propertyDoc) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    // Only allow 'flat' type properties
    if (propertyDoc.propertyType !== 'flat') {
      return res.status(400).json({ error: true, message: 'Maintenance can only be added for flats' });
    }

    const maintenance = new Maintenance({
      property,
      maintainer,
      activityDate,
      paidDate: paidDate || null,
      amount,
      description: description || '',
      status: status || (paidDate ? 'paid' : 'pending'),
      userId
    });

    await maintenance.save();
    await maintenance.populate('property', 'shopName shopNumber propertyType location');

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: maintenance
    });
  } catch (error) {
    myLogModule.error('Create maintenance error: ' + error);
    res.status(500).json({ error: true, message: 'Error creating maintenance record' });
  }
};

/**
 * GET ALL MAINTENANCE RECORDS
 */
exports.getAllMaintenance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { property, maintainer, status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (property) query.property = property;
    if (maintainer) query.maintainer = { $regex: maintainer, $options: 'i' };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const maintenanceRecords = await Maintenance.find(query)
      .populate('property', 'shopName shopNumber propertyType location')
      .sort({ activityDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Maintenance.countDocuments(query);

    res.json({
      success: true,
      data: maintenanceRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    myLogModule.error('Get all maintenance error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching maintenance records' });
  }
};

/**
 * GET MAINTENANCE BY ID
 */
exports.getMaintenance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const maintenance = await Maintenance.findOne({ _id: id, userId })
      .populate('property', 'shopName shopNumber propertyType location');

    if (!maintenance) {
      return res.status(404).json({ error: true, message: 'Maintenance record not found' });
    }

    res.json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    myLogModule.error('Get maintenance error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching maintenance record' });
  }
};

/**
 * UPDATE MAINTENANCE RECORD
 */
exports.updateMaintenance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { maintainer, activityDate, paidDate, amount, description, status } = req.body;

    const maintenance = await Maintenance.findOne({ _id: id, userId });
    if (!maintenance) {
      return res.status(404).json({ error: true, message: 'Maintenance record not found' });
    }

    if (maintainer) maintenance.maintainer = maintainer;
    if (activityDate) maintenance.activityDate = activityDate;
    if (paidDate !== undefined) maintenance.paidDate = paidDate;
    if (amount !== undefined) maintenance.amount = amount;
    if (description !== undefined) maintenance.description = description;
    if (status) maintenance.status = status;
    
    // Auto-update status based on paidDate
    if (paidDate !== undefined) {
      maintenance.status = paidDate ? 'paid' : 'pending';
    }

    await maintenance.save();
    await maintenance.populate('property', 'shopName shopNumber propertyType location');

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: maintenance
    });
  } catch (error) {
    myLogModule.error('Update maintenance error: ' + error);
    res.status(500).json({ error: true, message: 'Error updating maintenance record' });
  }
};

/**
 * DELETE MAINTENANCE RECORD
 */
exports.deleteMaintenance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const maintenance = await Maintenance.findOneAndDelete({ _id: id, userId });
    if (!maintenance) {
      return res.status(404).json({ error: true, message: 'Maintenance record not found' });
    }

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    myLogModule.error('Delete maintenance error: ' + error);
    res.status(500).json({ error: true, message: 'Error deleting maintenance record' });
  }
};

/**
 * GET MAINTENANCE STATISTICS/OVERALL SPENDING
 */
exports.getMaintenanceStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { property, startDate, endDate } = req.query;

    const query = { userId };
    if (property) query.property = property;
    if (startDate || endDate) {
      query.activityDate = {};
      if (startDate) query.activityDate.$gte = new Date(startDate);
      if (endDate) query.activityDate.$lte = new Date(endDate);
    }

    const allMaintenance = await Maintenance.find(query)
      .populate('property', 'shopName shopNumber propertyType location');

    const totalSpending = allMaintenance.reduce((sum, m) => sum + m.amount, 0);
    const paidSpending = allMaintenance
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount, 0);
    const pendingSpending = allMaintenance
      .filter(m => m.status === 'pending')
      .reduce((sum, m) => sum + m.amount, 0);

    const byMaintainer = {};
    allMaintenance.forEach(m => {
      if (!byMaintainer[m.maintainer]) {
        byMaintainer[m.maintainer] = { total: 0, paid: 0, pending: 0, count: 0 };
      }
      byMaintainer[m.maintainer].total += m.amount;
      byMaintainer[m.maintainer].count += 1;
      if (m.status === 'paid') {
        byMaintainer[m.maintainer].paid += m.amount;
      } else {
        byMaintainer[m.maintainer].pending += m.amount;
      }
    });

    const byProperty = {};
    allMaintenance.forEach(m => {
      const propId = m.property._id.toString();
      if (!byProperty[propId]) {
        byProperty[propId] = {
          property: m.property,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }
      byProperty[propId].total += m.amount;
      byProperty[propId].count += 1;
      if (m.status === 'paid') {
        byProperty[propId].paid += m.amount;
      } else {
        byProperty[propId].pending += m.amount;
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalSpending,
          paidSpending,
          pendingSpending,
          totalRecords: allMaintenance.length
        },
        byMaintainer: Object.entries(byMaintainer).map(([name, stats]) => ({
          maintainer: name,
          ...stats
        })),
        byProperty: Object.values(byProperty)
      }
    });
  } catch (error) {
    myLogModule.error('Get maintenance stats error: ' + error);
    res.status(500).json({ error: true, message: 'Error fetching maintenance statistics' });
  }
};

