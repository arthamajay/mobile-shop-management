const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const User = require('../models/User');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Salesperson is always scoped to their own branch — never trust req.query.branch for auth
    const branch = req.user.role === 'salesperson' ? req.user.branch : req.query.branch;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const billFilter = { status: 'active', createdAt: { $gte: today, $lte: todayEnd } };
    if (branch) billFilter.branch = branch;

    const bills = await Bill.find(billFilter);
    const todayRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalBillsToday = bills.length;

    const activeAlerts = await Alert.countDocuments({
      acknowledged: false,
      ...(branch ? { branch } : {}),
    });

    const productFilter = { isDeleted: false };
    if (branch) productFilter.branch = branch;
    const lowStockItems = await Product.countDocuments({
      ...productFilter,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });

    // Per-branch revenue today
    const branchRevenue = await Bill.aggregate([
      { $match: { status: 'active', createdAt: { $gte: today, $lte: todayEnd } } },
      { $group: { _id: '$branch', revenue: { $sum: '$grandTotal' }, bills: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        todayRevenue,
        totalBillsToday,
        activeAlerts,
        lowStockItems,
        branchRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getBranchComparison = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Bill.aggregate([
      { $match: { status: 'active', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$branch',
          revenue: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const data = await Bill.aggregate([
      { $match: { status: 'active', createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          revenue: { $sum: '$items.totalPrice' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeePerformance = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const data = await Bill.aggregate([
      { $match: { status: 'active', createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$salesperson',
          bills: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          salespersonId: '$_id',
          name: '$user.name',
          email: '$user.email',
          branch: '$user.branch',
          bills: 1,
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const data = await Bill.aggregate([
      { $match: { status: 'active', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, bills: 1, _id: 0 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
