const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');

router.get('/', authenticate, billController.getBills);
router.get('/summary', authenticate, billController.getDailySummary);
router.get('/:id', authenticate, billController.getBill);
router.post('/', authenticate, activityLogger, billController.createBill);
router.post('/:id/cancel-request', authenticate, activityLogger, billController.cancelBillRequest);
router.post('/:id/approve-cancel', authenticate, requireAdmin, activityLogger, billController.approveCancelBill);

module.exports = router;
