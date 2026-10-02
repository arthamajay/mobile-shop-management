const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');
const { validateLogin, validateRegister, validateUpdateUser } = require('../middleware/validators');

// Max 10 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/register', authenticate, requireAdmin, validateRegister, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, requireAdmin, authController.getUsers);
router.put('/users/:id', authenticate, requireAdmin, activityLogger, validateUpdateUser, authController.updateUser);

module.exports = router;
