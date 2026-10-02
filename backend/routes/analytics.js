const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, analyticsController.getDashboardStats);
router.get('/branch-comparison', authenticate, requireAdmin, analyticsController.getBranchComparison);
router.get('/top-products', authenticate, requireAdmin, analyticsController.getTopProducts);
router.get('/employee-performance', authenticate, requireAdmin, analyticsController.getEmployeePerformance);
router.get('/revenue-chart', authenticate, requireAdmin, analyticsController.getRevenueChart);

module.exports = router;
