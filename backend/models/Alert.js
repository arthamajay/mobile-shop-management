const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'low_stock',
        'suspicious_activity',
        'cash_mismatch',
        'quick_cancel',
        'excess_cancels',
        'stock_mismatch',
      ],
      required: true,
    },
    message: { type: String, required: true },
    branch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
    },
    relatedResource: { type: String },
    relatedResourceId: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Alert', alertSchema);
