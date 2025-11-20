const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/properties/:propertyId/tenant', tenantController.createTenant);
router.get('/', tenantController.getAllTenants);
router.put('/:tenantId', tenantController.updateTenant);
router.delete('/:tenantId', tenantController.deleteTenant);
router.put('/:id/rent-status', tenantController.updateRentStatus);
router.put('/:id/maintenance-status', tenantController.updateMaintenanceStatus);
router.put('/:id/lightbill-status', tenantController.updateLightBillStatus);

module.exports = router;

