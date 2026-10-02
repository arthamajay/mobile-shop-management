/**
 * Authentication and authorisation middleware.
 *
 * authenticate  — verifies JWT, hydrates req.user (with in-memory cache)
 * requireAdmin  — blocks non-admin users with 403
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCachedUser, setCachedUser, invalidateUser } = require('../utils/userCache');

/**
 * Verify the Bearer JWT and attach the user document to req.user.
 * Uses a 5-minute in-memory cache to avoid a DB round-trip on every request.
 * Cache is invalidated immediately when a user is updated/deactivated.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = String(decoded.id);

    // Try cache first — skip DB round-trip if still fresh
    let user = getCachedUser(userId);
    if (!user) {
      user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      setCachedUser(userId, user);
    }

    if (!user.isActive) {
      invalidateUser(userId);
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/** Allow only admin users. Must be used after authenticate. */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
