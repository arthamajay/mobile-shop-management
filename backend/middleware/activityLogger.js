const ActivityLog = require('../models/ActivityLog');

const activityLogger = (req, res, next) => {
  const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!methodsToLog.includes(req.method)) return next();

  res.on('finish', async () => {
    if (res.statusCode >= 400) return;
    if (!req.user) return;

    try {
      const resource = req.baseUrl.replace('/api/', '') || req.path;
      const resourceId = req.params.id || null;

      await ActivityLog.create({
        userId: req.user._id,
        userEmail: req.user.email,
        action: req.method,
        resource,
        resourceId,
        branch: req.user.branch || req.body.branch || null,
        details: {
          path: req.originalUrl,
          body: sanitizeBody(req.body),
        },
        ipAddress: req.ip || req.connection.remoteAddress,
      });
    } catch (err) {
      console.error('Activity log error:', err.message);
    }
  });

  next();
};

function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.confirmPassword;
  return sanitized;
}

module.exports = activityLogger;
