const Alert = require('../models/Alert');

exports.getAlerts = async (req, res, next) => {
  try {
    const filter = { acknowledged: false };
    if (req.user.role === 'salesperson') {
      filter.branch = req.user.branch;
    }
    const alerts = await Alert.find(filter)
      .populate('acknowledgedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    ).populate('acknowledgedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

exports.getAlertHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, branch, type } = req.query;
    const filter = { acknowledged: true };
    if (branch) filter.branch = branch;
    if (type) filter.type = type;

    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .populate('acknowledgedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, alerts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
