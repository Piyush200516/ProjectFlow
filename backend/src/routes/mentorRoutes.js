const express = require('express');
const router = express.Router();
const { getMentorStats, getReviewQueue } = require('../controllers/mentorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('mentor', 'hod', 'admin'), getMentorStats);
router.get('/reviews', protect, authorize('mentor', 'hod', 'admin'), getReviewQueue);

module.exports = router;
