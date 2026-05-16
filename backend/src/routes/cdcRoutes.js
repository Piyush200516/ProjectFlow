const express = require('express');
const router = express.Router();
const { getCdcStats, getStartups } = require('../controllers/cdcController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getCdcStats);
router.get('/startups', protect, getStartups);

module.exports = router;
