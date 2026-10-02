/**
 * Alert engine — creates Alert documents and broadcasts them in real time
 * to connected admin SSE clients.
 *
 * The broadcastAlert function is injected at startup via setBroadcastFn()
 * to avoid a circular dependency with routes/sse.js.
 */

const Alert = require('../models/Alert');

let broadcastAlert = null;

/** Inject the SSE broadcast function from routes/sse.js. */
function setBroadcastFn(fn) {
  broadcastAlert = fn;
}

/**
 * Create an alert and broadcast it to all connected admin SSE clients.
 *
 * Deduplication: for low_stock and stock_mismatch alerts, if an unacknowledged
 * alert already exists for the same product + branch, the existing alert is
 * returned without creating a duplicate.
 *
 * @param {string} type           - Alert type enum value
 * @param {string} message        - Human-readable alert message
 * @param {string} branch         - Branch the alert belongs to
 * @param {string} severity       - 'low' | 'medium' | 'high'
 * @param {string} relatedResource - Resource type label (e.g. 'Product', 'Bill')
 * @param {string} relatedResourceId - Resource ObjectId string
 * @returns {Promise<Alert|null>}
 */
async function createAlert(type, message, branch, severity, relatedResource, relatedResourceId) {
  try {
    // Deduplication: skip creation if an identical unacknowledged alert exists
    if ((type === 'low_stock' || type === 'stock_mismatch') && relatedResourceId) {
      const existing = await Alert.findOne({
        type,
        relatedResourceId,
        branch,
        acknowledged: false,
      });
      if (existing) return existing;
    }

    const alert = await Alert.create({
      type,
      message,
      branch,
      severity,
      relatedResource,
      relatedResourceId,
    });

    if (broadcastAlert) {
      broadcastAlert(alert);
    }

    return alert;
  } catch (err) {
    console.error('[alertEngine] Alert creation error:', err.message);
    return null;
  }
}

module.exports = { createAlert, setBroadcastFn };
