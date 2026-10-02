const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');

router.get('/', authenticate, productController.getProducts);
router.get('/:id', authenticate, productController.getProduct);
router.post('/', authenticate, requireAdmin, activityLogger, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, activityLogger, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, activityLogger, productController.deleteProduct);
router.post('/:id/imei', authenticate, requireAdmin, activityLogger, productController.addIMEI);
router.get('/imei/:imei/history', authenticate, productController.getIMEIHistory);

module.exports = router;
