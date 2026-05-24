const express = require('express');
const router = express.Router();
const {
  getMentorStats,
  getReviewQueue,
  getAssignedProjects,
  createMentorMilestones,
  upsertContribution,
  createMeetingLog,
  getDocumentVersions
} = require('../controllers/mentorController');
const { reviewMilestoneSubmission } = require('../controllers/milestoneController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('mentor', 'hod', 'admin'), getMentorStats);
router.get('/reviews', protect, authorize('mentor', 'hod', 'admin'), getReviewQueue);
router.get('/assigned-projects', protect, authorize('mentor', 'hod', 'admin'), getAssignedProjects);
router.post('/milestones', protect, authorize('mentor', 'hod', 'admin'), createMentorMilestones);
router.patch('/submissions/:id/review', protect, authorize('mentor', 'hod', 'admin'), reviewMilestoneSubmission);
router.post('/contribution', protect, authorize('mentor', 'hod', 'admin'), upsertContribution);
router.post('/meeting-log', protect, authorize('mentor', 'hod', 'admin'), createMeetingLog);
router.get('/submissions/:id/versions', protect, authorize('mentor', 'hod', 'admin'), getDocumentVersions);

module.exports = router;
