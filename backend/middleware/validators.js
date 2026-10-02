const { body, validationResult } = require('express-validator');

/**
 * Reads the result of express-validator checks and short-circuits with a
 * 400 response listing all field errors if any failed.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // first error as the main message
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ──────────────────────────────────────────────────────────

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation,
];

exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'salesperson']).withMessage('Role must be admin or salesperson'),
  body('branch')
    .if(body('role').equals('salesperson'))
    .notEmpty().withMessage('Branch is required for salesperson')
    .isIn(['Kukatpally', 'KPHB', 'Beeramguda']).withMessage('Invalid branch'),
  handleValidation,
];

exports.validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('branch')
    .optional()
    .isIn(['Kukatpally', 'KPHB', 'Beeramguda']).withMessage('Invalid branch'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidation,
];
