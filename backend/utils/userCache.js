/**
 * Simple in-memory user cache shared between auth middleware and controllers.
 * Kept in its own module to avoid circular require issues.
 */

const userCache = new Map(); // key: userId string → { user, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedUser(userId) {
  const entry = userCache.get(String(userId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(String(userId));
    return null;
  }
  return entry.user;
}

function setCachedUser(userId, user) {
  userCache.set(String(userId), { user, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateUser(userId) {
  userCache.delete(String(userId));
}

module.exports = { getCachedUser, setCachedUser, invalidateUser };
