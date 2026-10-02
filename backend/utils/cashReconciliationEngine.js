const Bill = require('../models/Bill');

/**
 * Compute expected cash for a branch on a given date
 * by summing all active Cash-mode bills for that day
 * @param {string} branch
 * @param {Date|string} date
 * @returns {Promise<number>}
 */
async function computeExpectedCash(branch, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await Bill.aggregate([
    {
      $match: {
        branch,
        paymentMode: 'Cash',
        status: 'active',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$grandTotal' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
}

module.exports = { computeExpectedCash };
