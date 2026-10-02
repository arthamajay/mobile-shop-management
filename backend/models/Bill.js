const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  imei: { type: String, default: null },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  gst: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
    },
    customer: {
      name: { type: String, required: true },
      phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Phone must be 10 digits'],
      },
    },
    items: [billItemSchema],
    subtotal: { type: Number, required: true },
    totalGST: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: true,
    },
    branch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
      required: true,
    },
    salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
    },
    cancelRequest: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date },
      reason: { type: String },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
    },
    pdfUrl: { type: String, default: null },
    whatsappSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    this.billNumber = `BILL-${datePart}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
