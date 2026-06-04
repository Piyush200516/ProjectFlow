const express = require('express');
const router = express.Router();
const {
  getMentorAllocations,
  createMentorAllocation,
  updateMentorAllocation
} = require('../controllers/hodController');
const { protect, authorize } = require('../middleware/authMiddleware');

const hodOnly = [protect, authorize('hod', 'admin')];

router.get('/', ...hodOnly, getMentorAllocations);
router.post('/', ...hodOnly, createMentorAllocation);
router.put('/:id', ...hodOnly, updateMentorAllocation);
router.patch('/:id', ...hodOnly, updateMentorAllocation);

module.exports = router;
