const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { invalidateUser } = require('../utils/userCache');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  branch: user.branch,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, branch } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, branch });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: userResponse(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user: userResponse(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: userResponse(req.user) });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.branch) filter.branch = req.query.branch;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, branch, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, branch, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Bust the auth cache so changes (especially deactivation) take effect immediately
    invalidateUser(req.params.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
