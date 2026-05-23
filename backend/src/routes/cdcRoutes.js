const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStartups,
  getIndustryCollaborations
} = require('../controllers/cdcController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('cdc', 'hod', 'admin'), getDashboardStats);
router.get('/startups', protect, authorize('cdc', 'hod', 'admin'), getStartups);
router.get('/industry-collaborations', protect, authorize('cdc', 'hod', 'admin'), getIndustryCollaborations);

module.exports = router;
