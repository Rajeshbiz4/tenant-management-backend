const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

// Make payment
router.post('/make',authenticateToken, paymentController.makePayment);

// Get payments with filters
router.get('/', authenticateToken, paymentController.getPayments);

// Reports
router.get('/report',authenticateToken,  paymentController.getReport);

module.exports = router;
