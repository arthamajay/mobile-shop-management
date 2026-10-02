const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Mobile', 'Accessory', 'Other'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer',
      },
    },
    branch: {
      type: String,
      enum: ['Kukatpally', 'KPHB', 'Beeramguda'],
      required: [true, 'Branch is required'],
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    imeiNumbers: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every((imei) => /^\d{15}$/.test(imei));
        },
        message: 'Each IMEI must be exactly 15 digits',
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
