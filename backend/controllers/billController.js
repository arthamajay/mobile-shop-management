const Bill = require('../models/Bill');
const Product = require('../models/Product');
const { createAlert } = require('../utils/alertEngine');
const { generateBillPDF } = require('../utils/pdfGenerator');
const { sendBillWhatsApp } = require('../utils/whatsappService');
const { validateIMEIFormat } = require('../utils/imeiValidator');

const GST_RATE = 0.18;

exports.getBills = async (req, res, next) => {
  try {
    const { branch, startDate, endDate, status, salesperson, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (req.user.role === 'salesperson') {
      filter.branch = req.user.branch;
    } else if (branch) {
      filter.branch = branch;
    }

    if (status) filter.status = status;
    if (salesperson) filter.salesperson = salesperson;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter)
      .populate('salesperson', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, bills, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('salesperson', 'name email branch')
      .populate('items.product', 'name category')
      .populate('cancelRequest.approvedBy', 'name email');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

exports.createBill = async (req, res, next) => {
  try {
    const { customer, items, paymentMode, branch } = req.body;

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const billBranch = req.user.role === 'salesperson' ? req.user.branch : branch;

    if (!billBranch) {
      return res.status(400).json({ success: false, message: 'Branch is required' });
    }

    // ── Per-item validation pass (no DB writes yet) ──────────────────────────
    // Collect all IMEIs across the entire request to detect duplicates
    const allRequestIMEIs = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Quantity must be a positive integer
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: quantity must be a positive integer (got ${item.quantity})`,
        });
      }

      // Mobile products require exactly one IMEI per unit
      // We pre-check this before hitting the DB so we fail fast
      const imeiList = Array.isArray(item.imei) ? item.imei : (item.imei ? [item.imei] : []);

      // Store normalised quantity back so later code can use it safely
      item._validatedQty = qty;
      item._imeiList = imeiList;

      // Check for duplicate IMEIs within this request
      for (const imei of imeiList) {
        if (allRequestIMEIs.includes(imei)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate IMEI in request: ${imei}`,
          });
        }
        allRequestIMEIs.push(imei);
      }
    }

    // ── DB validation + atomic stock/IMEI operations ─────────────────────────
    const processedItems = [];
    let subtotal = 0;
    let totalGST = 0;

    // Track which stock decrements succeeded so we can roll back on failure
    const stockDecrements = []; // { productId, quantity }
    const imeiRemovals = [];    // { productId, imei }

    try {
      for (const item of items) {
        const qty = item._validatedQty;
        const imeiList = item._imeiList;

        // Find product — must exist at this branch and not be soft-deleted
        const product = await Product.findOne({
          _id: item.productId,
          isDeleted: false,
          branch: billBranch,
        });
        if (!product) {
          throw { status: 400, message: `Product not found in branch ${billBranch}: ${item.productId}` };
        }

        // Enforce IMEI requirement for Mobile products
        if (product.category === 'Mobile') {
          if (imeiList.length === 0) {
            throw { status: 400, message: `IMEI is required for Mobile product "${product.name}"` };
          }
          if (imeiList.length !== qty) {
            throw {
              status: 400,
              message: `Mobile product "${product.name}" requires exactly ${qty} IMEI(s) for quantity ${qty}, got ${imeiList.length}`,
            };
          }
          // Validate each IMEI format
          for (const imei of imeiList) {
            if (!validateIMEIFormat(imei)) {
              throw { status: 400, message: `Invalid IMEI format: ${imei}` };
            }
          }
        }

        // ── Atomic stock decrement with stock guard (prevents overselling) ──
        // $gte: qty ensures we only decrement if enough stock is still available,
        // making this check + update atomic and safe under concurrent requests.
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id, branch: billBranch, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );
        if (!updatedProduct) {
          throw {
            status: 400,
            message: `Insufficient stock for "${product.name}". Requested: ${qty}, available: ${product.stock}`,
          };
        }
        stockDecrements.push({ productId: product._id, quantity: qty });

        // ── Atomic IMEI removal (prevents IMEI race condition) ───────────────
        // For each IMEI: atomically verify it still belongs to this product
        // AND remove it in a single operation. If the IMEI was already sold
        // by a concurrent request, $pull returns unmodified and we catch it.
        for (const imei of imeiList) {
          const imeiResult = await Product.findOneAndUpdate(
            { _id: product._id, branch: billBranch, imeiNumbers: imei },
            { $pull: { imeiNumbers: imei } },
            { new: true }
          );
          if (!imeiResult) {
            throw {
              status: 400,
              message: `IMEI ${imei} not found in stock for "${product.name}" (may have been sold concurrently)`,
            };
          }
          imeiRemovals.push({ productId: product._id, imei });
        }

        // ── Calculate financials (server-side, never trust client values) ────
        const unitPrice = product.price;
        const basePrice = unitPrice * qty;
        const gstAmount = parseFloat((basePrice * GST_RATE).toFixed(2));
        const totalPrice = parseFloat((basePrice + gstAmount).toFixed(2));

        subtotal += basePrice;
        totalGST += gstAmount;

        // Store one item entry per unit if multiple IMEIs, or one grouped entry
        if (product.category === 'Mobile' && imeiList.length > 1) {
          // Split into one line-item per IMEI unit for clear audit trail
          for (const imei of imeiList) {
            const singleBase = unitPrice;
            const singleGst = parseFloat((singleBase * GST_RATE).toFixed(2));
            processedItems.push({
              product: product._id,
              productName: product.name,
              imei,
              quantity: 1,
              unitPrice,
              gst: singleGst,
              totalPrice: parseFloat((singleBase + singleGst).toFixed(2)),
            });
          }
        } else {
          processedItems.push({
            product: product._id,
            productName: product.name,
            imei: imeiList[0] || null,
            quantity: qty,
            unitPrice,
            gst: gstAmount,
            totalPrice,
          });
        }
      }
    } catch (innerErr) {
      // ── Rollback all stock decrements that succeeded before the failure ────
      for (const dec of stockDecrements) {
        await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.quantity } }).catch(() => {});
      }
      // Rollback IMEI removals
      for (const rem of imeiRemovals) {
        await Product.findByIdAndUpdate(rem.productId, { $push: { imeiNumbers: rem.imei } }).catch(() => {});
      }

      const status = innerErr.status || 500;
      const message = innerErr.message || 'Bill creation failed';
      return res.status(status).json({ success: false, message });
    }

    const grandTotal = parseFloat((subtotal + totalGST).toFixed(2));

    // ── Create bill document ──────────────────────────────────────────────────
    const bill = await Bill.create({
      customer,
      items: processedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal,
      paymentMode,
      branch: billBranch,
      salesperson: req.user._id,
    });

    // ── Async side-effects (PDF + WhatsApp) — never block the sale ───────────
    generateBillPDF(bill)
      .then(async (pdfUrl) => {
        await Bill.findByIdAndUpdate(bill._id, { pdfUrl });
      })
      .catch((err) => console.error('PDF generation error:', err.message));

    sendBillWhatsApp(customer.phone, customer.name, bill.billNumber, grandTotal, null)
      .then(async (sent) => {
        if (sent) await Bill.findByIdAndUpdate(bill._id, { whatsappSent: true });
      })
      .catch((err) => console.error('WhatsApp error:', err.message));

    // ── Low-stock alerts (async, non-blocking) ────────────────────────────────
    for (const item of processedItems) {
      Product.findById(item.product)
        .then((updatedProduct) => {
          if (updatedProduct && updatedProduct.stock <= updatedProduct.lowStockThreshold) {
            createAlert(
              'low_stock',
              `Low stock: ${updatedProduct.name} has ${updatedProduct.stock} units at ${billBranch}`,
              billBranch,
              updatedProduct.stock === 0 ? 'high' : 'medium',
              'Product',
              updatedProduct._id.toString()
            ).catch(console.error);
          }
        })
        .catch(() => {});
    }

    res.status(201).json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

exports.cancelBillRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Bill is not active' });
    }
    if (bill.cancelRequest.requested) {
      return res.status(400).json({ success: false, message: 'Cancellation already requested' });
    }

    // Salespersons may only request cancellation on their own bills
    if (req.user.role === 'salesperson' &&
        bill.salesperson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only request cancellation for your own bills' });
    }

    bill.cancelRequest = {
      requested: true,
      requestedAt: new Date(),
      reason: reason || 'No reason provided',
    };
    await bill.save();

    // Quick cancel alert (within 10 minutes of bill creation)
    const minutesSinceBill = (Date.now() - new Date(bill.createdAt).getTime()) / 60000;
    if (minutesSinceBill <= 10) {
      await createAlert(
        'quick_cancel',
        `Quick cancel request: Bill ${bill.billNumber} was created ${Math.round(minutesSinceBill)} min ago`,
        bill.branch,
        'high',
        'Bill',
        bill._id.toString()
      );
    }

    // Count today's cancellations for this salesperson
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cancelCount = await Bill.countDocuments({
      salesperson: req.user._id,
      'cancelRequest.requested': true,
      'cancelRequest.requestedAt': { $gte: today },
    });

    if (cancelCount > 2) {
      await createAlert(
        'excess_cancels',
        `Excess cancellations: ${req.user.name} has requested ${cancelCount} cancellations today`,
        bill.branch,
        'high',
        'User',
        req.user._id.toString()
      );
    }

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

exports.approveCancelBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Bill is already cancelled' });
    }
    // Guard: a cancellation request must exist before it can be approved
    if (!bill.cancelRequest?.requested) {
      return res.status(400).json({ success: false, message: 'No cancellation request found for this bill' });
    }

    // Reverse stock increments
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      if (item.imei) {
        await Product.findByIdAndUpdate(item.product, { $push: { imeiNumbers: item.imei } });
      }
    }

    bill.status = 'cancelled';
    bill.cancelRequest.approvedBy = req.user._id;
    bill.cancelRequest.approvedAt = new Date();
    await bill.save();

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

exports.getDailySummary = async (req, res, next) => {
  try {
    const { branch, date } = req.query;
    const queryBranch = req.user.role === 'salesperson' ? req.user.branch : branch;

    const queryDate = date ? new Date(date) : new Date();
    const start = new Date(queryDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(queryDate);
    end.setHours(23, 59, 59, 999);

    const filter = {
      status: 'active',
      createdAt: { $gte: start, $lte: end },
    };
    if (queryBranch) filter.branch = queryBranch;

    const bills = await Bill.find(filter);
    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalBills = bills.length;
    const cashRevenue = bills.filter((b) => b.paymentMode === 'Cash').reduce((s, b) => s + b.grandTotal, 0);
    const upiRevenue = bills.filter((b) => b.paymentMode === 'UPI').reduce((s, b) => s + b.grandTotal, 0);
    const cardRevenue = bills.filter((b) => b.paymentMode === 'Card').reduce((s, b) => s + b.grandTotal, 0);

    res.json({ success: true, summary: { totalRevenue, totalBills, cashRevenue, upiRevenue, cardRevenue, branch: queryBranch, date: queryDate } });
  } catch (err) {
    next(err);
  }
};
