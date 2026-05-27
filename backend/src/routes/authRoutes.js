const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, forgotPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', register);
router.post('/login', authLoginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.get('/test', (req, res) => res.json({ message: "Auth route working" }));

module.exports = router;
