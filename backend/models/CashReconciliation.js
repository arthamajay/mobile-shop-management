const mongoose = require('mongoose');

const cashReconciliationSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
      required: true,
    },
    date: { type: Date, required: true },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expectedCash: { type: Number, required: true },
    physicalCount: { type: Number, required: true },
    discrepancy: { type: Number, required: true },
    status: {
      type: String,
      enum: ['matched', 'mismatch'],
      required: true,
    },
    notes: { type: String, default: '' },
    alertCreated: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('CashReconciliation', cashReconciliationSchema);
