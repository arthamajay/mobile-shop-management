const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');
const { authenticate } = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');

router.get('/', authenticate, reconciliationController.getReconciliations);
router.post('/', authenticate, activityLogger, reconciliationController.submitReconciliation);

module.exports = router;
