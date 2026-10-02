const StockTransfer = require('../models/StockTransfer');
const Product = require('../models/Product');

exports.getTransfers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'salesperson') {
      filter.$or = [{ fromBranch: req.user.branch }, { toBranch: req.user.branch }];
    } else {
      if (req.query.branch) {
        filter.$or = [{ fromBranch: req.query.branch }, { toBranch: req.query.branch }];
      }
    }
    if (req.query.status) filter.status = req.query.status;

    const transfers = await StockTransfer.find(filter)
      .populate('product', 'name category')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, transfers });
  } catch (err) {
    next(err);
  }
};

exports.requestTransfer = async (req, res, next) => {
  try {
    const { fromBranch, toBranch, productId, quantity, notes } = req.body;

    // Quantity must be a positive integer
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    if (fromBranch === toBranch) {
      return res.status(400).json({ success: false, message: 'Source and destination branches must differ' });
    }

    // Salespersons can only transfer FROM their own branch — never trust req.body.fromBranch for auth
    if (req.user.role === 'salesperson' && fromBranch !== req.user.branch) {
      return res.status(403).json({ success: false, message: 'You can only transfer stock from your own branch' });
    }

    const product = await Product.findOne({ _id: productId, branch: fromBranch, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found in source branch' });
    }

    // Atomic stock reserve: only decrement if sufficient stock still exists
    const reserved = await Product.findOneAndUpdate(
      { _id: product._id, branch: fromBranch, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );
    if (!reserved) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock: only ${product.stock} unit(s) available`,
      });
    }

    const transfer = await StockTransfer.create({
      fromBranch,
      toBranch,
      product: productId,
      quantity: qty,
      requestedBy: req.user._id,
      notes: notes || '',
    });

    res.status(201).json({ success: true, transfer });
  } catch (err) {
    next(err);
  }
};

exports.approveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id).populate('product');
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Transfer is not pending' });
    }

    const srcProduct = await Product.findById(transfer.product._id);
    if (!srcProduct) {
      return res.status(404).json({ success: false, message: 'Source product no longer exists' });
    }

    // For Mobile products, we must move exactly qty IMEIs from source to destination.
    // We take the first N IMEIs from the source's imeiNumbers array.
    const isMobile = transfer.product.category === 'Mobile';
    let transferredIMEIs = [];

    if (isMobile) {
      if (srcProduct.imeiNumbers.length < transfer.quantity) {
        return res.status(400).json({
          success: false,
          message: `Source product only has ${srcProduct.imeiNumbers.length} IMEI(s) registered — cannot transfer ${transfer.quantity} unit(s). Add IMEIs to source product first.`,
        });
      }
      // Take the first qty IMEIs from the source
      transferredIMEIs = srcProduct.imeiNumbers.slice(0, transfer.quantity);
      // Remove them from the source product's IMEI list
      await Product.findByIdAndUpdate(srcProduct._id, {
        $pull: { imeiNumbers: { $in: transferredIMEIs } },
      });
    }

    // Find or create the product at the destination branch
    const destProduct = await Product.findOne({
      name: transfer.product.name,
      branch: transfer.toBranch,
      isDeleted: false,
    });

    if (destProduct) {
      const update = { $inc: { stock: transfer.quantity } };
      if (isMobile && transferredIMEIs.length > 0) {
        update.$push = { imeiNumbers: { $each: transferredIMEIs } };
      }
      await Product.findByIdAndUpdate(destProduct._id, update);
    } else {
      await Product.create({
        name: transfer.product.name,
        category: transfer.product.category,
        price: transfer.product.price,
        stock: transfer.quantity,
        branch: transfer.toBranch,
        lowStockThreshold: transfer.product.lowStockThreshold,
        imeiNumbers: transferredIMEIs,
      });
    }

    transfer.status = 'Completed';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    res.json({ success: true, transfer });
  } catch (err) {
    next(err);
  }
};

exports.rejectTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Transfer is not pending' });
    }

    // Return reserved stock to source branch
    await Product.findOneAndUpdate(
      { _id: transfer.product, branch: transfer.fromBranch, isDeleted: false },
      { $inc: { stock: transfer.quantity } }
    );

    transfer.status = 'Rejected';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    res.json({ success: true, transfer });
  } catch (err) {
    next(err);
  }
};
