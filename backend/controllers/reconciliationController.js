const CashReconciliation = require('../models/CashReconciliation');
const { computeExpectedCash } = require('../utils/cashReconciliationEngine');
const { createAlert } = require('../utils/alertEngine');

exports.submitReconciliation = async (req, res, next) => {
  try {
    const { physicalCount, date, notes } = req.body;
    const branch = req.user.role === 'salesperson' ? req.user.branch : req.body.branch;

    // Validate physicalCount
    const count = Number(physicalCount);
    if (!Number.isFinite(count) || count < 0) {
      return res.status(400).json({ success: false, message: 'physicalCount must be a non-negative number' });
    }

    const reconciliationDate = date ? new Date(date) : new Date();
    const expectedCash = await computeExpectedCash(branch, reconciliationDate);
    const discrepancy = count - expectedCash;
    const status = Math.abs(discrepancy) < 1 ? 'matched' : 'mismatch';

    let alertCreated = false;
    if (status === 'mismatch') {
      await createAlert(
        'cash_mismatch',
        `Cash mismatch at ${branch}: Expected ₹${expectedCash.toFixed(2)}, Found ₹${count.toFixed(2)}, Discrepancy ₹${discrepancy.toFixed(2)}`,
        branch,
        Math.abs(discrepancy) > 500 ? 'high' : 'medium',
        'CashReconciliation',
        null
      );
      alertCreated = true;
    }

    const reconciliation = await CashReconciliation.create({
      branch,
      date: reconciliationDate,
      submittedBy: req.user._id,
      expectedCash,
      physicalCount: count,
      discrepancy,
      status,
      notes: notes || '',
      alertCreated,
    });

    res.status(201).json({ success: true, reconciliation });
  } catch (err) {
    next(err);
  }
};

exports.getReconciliations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'salesperson') {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const reconciliations = await CashReconciliation.find(filter)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, reconciliations });
  } catch (err) {
    next(err);
  }
};
