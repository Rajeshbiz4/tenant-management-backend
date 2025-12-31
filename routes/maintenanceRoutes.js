const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/', maintenanceController.createMaintenance);
router.get('/stats', maintenanceController.getMaintenanceStats);
router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', maintenanceController.getMaintenance);
router.put('/:id', maintenanceController.updateMaintenance);
router.delete('/:id', maintenanceController.deleteMaintenance);

module.exports = router;

