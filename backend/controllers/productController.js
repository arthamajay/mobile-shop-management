const Product = require('../models/Product');
const { validateIMEIFormat } = require('../utils/imeiValidator');
const { createAlert } = require('../utils/alertEngine');
const Bill = require('../models/Bill');

async function checkLowStock(product) {
  if (product.stock <= product.lowStockThreshold) {
    await createAlert(
      'low_stock',
      `Low stock: ${product.name} has ${product.stock} units at ${product.branch}`,
      product.branch,
      product.stock === 0 ? 'high' : 'medium',
      'Product',
      product._id.toString()
    );
  }
}

exports.getProducts = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    if (req.user.role === 'salesperson') {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, branch, lowStockThreshold, imeiNumbers } = req.body;

    const productBranch = req.user.role === 'salesperson' ? req.user.branch : branch;

    // Mobile products must have exactly one IMEI per unit in stock
    if (category === 'Mobile') {
      const imeis = imeiNumbers || [];
      const stockQty = parseInt(stock, 10);
      if (imeis.length !== stockQty) {
        return res.status(400).json({
          success: false,
          message: `Mobile products require exactly ${stockQty} IMEI(s) to match stock quantity. Got ${imeis.length}.`,
        });
      }
    }

    if (imeiNumbers && imeiNumbers.length > 0) {
      for (const imei of imeiNumbers) {
        if (!validateIMEIFormat(imei)) {
          return res.status(400).json({ success: false, message: `Invalid IMEI format: ${imei}` });
        }
        const exists = await Product.findOne({ imeiNumbers: imei, isDeleted: false });
        if (exists) {
          return res.status(400).json({ success: false, message: `IMEI ${imei} already exists in inventory` });
        }
      }
    }

    const product = await Product.create({
      name,
      category,
      price,
      stock,
      branch: productBranch,
      lowStockThreshold: lowStockThreshold || 5,
      imeiNumbers: imeiNumbers || [],
    });

    await checkLowStock(product);

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, category, price, stock, lowStockThreshold, imeiNumbers } = req.body;

    if (imeiNumbers && imeiNumbers.length > 0) {
      for (const imei of imeiNumbers) {
        if (!validateIMEIFormat(imei)) {
          return res.status(400).json({ success: false, message: `Invalid IMEI format: ${imei}` });
        }
        const exists = await Product.findOne({
          imeiNumbers: imei,
          isDeleted: false,
          _id: { $ne: product._id },
        });
        if (exists) {
          return res.status(400).json({ success: false, message: `IMEI ${imei} already exists` });
        }
      }
      product.imeiNumbers = imeiNumbers;
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;

    await product.save();
    await checkLowStock(product);

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.addIMEI = async (req, res, next) => {
  try {
    const { imei } = req.body;
    if (!imei) {
      return res.status(400).json({ success: false, message: 'IMEI is required' });
    }
    if (!validateIMEIFormat(imei)) {
      return res.status(400).json({ success: false, message: 'Invalid IMEI format (must be 15 digits, Luhn-valid)' });
    }

    const exists = await Product.findOne({ imeiNumbers: imei, isDeleted: false });
    if (exists) {
      return res.status(400).json({ success: false, message: 'IMEI already exists in inventory' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $push: { imeiNumbers: imei } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.getIMEIHistory = async (req, res, next) => {
  try {
    const { imei } = req.params;
    const bills = await Bill.find({ 'items.imei': imei })
      .populate('salesperson', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, bills });
  } catch (err) {
    next(err);
  }
};
