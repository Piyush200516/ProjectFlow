const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/enterpriseAuthController');
const { requireAuth } = require('../middleware/enterpriseAuthMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);
router.post('/forgot-password', authLimiter, controller.forgotPassword);
router.post('/reset-password', authLimiter, controller.resetPassword);
router.post('/email-verification', authLimiter, controller.sendVerification);
router.post('/verify-email', authLimiter, controller.verifyEmail);

module.exports = router;
