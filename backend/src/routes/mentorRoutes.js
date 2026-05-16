const express = require('express');
const router = express.Router();
const { getMentorStats, getReviewQueue } = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getMentorStats);
router.get('/reviews', protect, getReviewQueue);

module.exports = router;
