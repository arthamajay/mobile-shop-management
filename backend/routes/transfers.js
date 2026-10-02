const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');

router.get('/', authenticate, transferController.getTransfers);
router.post('/', authenticate, activityLogger, transferController.requestTransfer);
router.post('/:id/approve', authenticate, requireAdmin, activityLogger, transferController.approveTransfer);
router.post('/:id/reject', authenticate, requireAdmin, activityLogger, transferController.rejectTransfer);

module.exports = router;
