const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/', propertyController.createProperty);
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getProperty);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;

