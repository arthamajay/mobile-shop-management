const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, alertController.getAlerts);
router.get('/history', authenticate, requireAdmin, alertController.getAlertHistory);
router.put('/:id/acknowledge', authenticate, requireAdmin, alertController.acknowledgeAlert);

module.exports = router;
