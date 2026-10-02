/**
 * Server-Sent Events (SSE) — real-time alert stream for admin users.
 *
 * Two-step authentication keeps the primary JWT out of URLs:
 *   1. POST /api/sse/token  — authenticated admin exchanges Bearer JWT for a
 *      short-lived (60 s) SSE-only token  { id, sse: true }
 *   2. GET  /api/sse/alerts?token=...  — connects the SSE stream using the
 *      short-lived token (EventSource cannot set custom headers)
 *
 * Connected clients are tracked in an in-memory Map and cleaned up on
 * disconnect. A 30-second heartbeat comment keeps proxies from timing out.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

// In-memory registry of connected admin SSE clients: clientId → res
const adminClients = new Map();
let clientIdCounter = 0;

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Broadcast an alert to all connected admin SSE clients.
 * Stale connections that throw on write are removed automatically.
 * @param {object} alert - Mongoose Alert document or plain object
 */
function broadcastAlert(alert) {
  const data = JSON.stringify(alert);
  for (const [id, res] of adminClients.entries()) {
    try {
      res.write(`event: alert\ndata: ${data}\n\n`);
    } catch {
      adminClients.delete(id);
    }
  }
}

/**
 * POST /api/sse/token
 * Exchange a valid admin Bearer JWT for a 60-second SSE-only token.
 * Requires: authenticate + requireAdmin
 */
router.post('/token', authenticate, requireAdmin, (req, res) => {
  const sseToken = jwt.sign(
    { id: req.user._id, sse: true },
    process.env.JWT_SECRET,
    { expiresIn: '60s' }
  );
  res.json({ success: true, sseToken });
});

/**
 * GET /api/sse/alerts?token=<sseToken>
 * Open an SSE stream. Requires a valid short-lived SSE token (not the primary JWT).
 */
router.get('/alerts', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject primary JWTs — must be an SSE-specific token
    if (!decoded.sse) {
      return res.status(403).json({ success: false, message: 'Invalid token type for SSE' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const clientId = ++clientIdCounter;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

    adminClients.set(clientId, res);

    if (!IS_PROD) {
      console.log(`[SSE] Client connected: ${clientId} (${user.email}). Total: ${adminClients.size}`);
    }

    // 30-second heartbeat keeps the connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(':heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        adminClients.delete(clientId);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      adminClients.delete(clientId);
      if (!IS_PROD) {
        console.log(`[SSE] Client disconnected: ${clientId}. Total: ${adminClients.size}`);
      }
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
module.exports.broadcastAlert = broadcastAlert;
