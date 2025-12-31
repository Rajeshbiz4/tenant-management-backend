const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.get('/overview', statsController.getOverview);
router.get('/monthly', statsController.getMonthlyStats);
router.get('/yearly', statsController.getYearlyStats);
router.get('/analytics', statsController.getAnalytics);

module.exports = router;

