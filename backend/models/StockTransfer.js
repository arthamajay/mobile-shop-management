const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema(
  {
    fromBranch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
      required: true,
    },
    toBranch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Rejected', 'Completed'],
      default: 'Pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
