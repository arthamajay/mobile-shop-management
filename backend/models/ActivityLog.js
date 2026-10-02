const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    branch: { type: String, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
