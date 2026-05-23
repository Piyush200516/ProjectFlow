const express = require('express');
const router = express.Router();
const { 
  getHodStats, 
  getAllProjects,
  createRegistrationForm,
  getRegistrationForms,
  updateRegistrationForm,
  publishRegistrationForm,
  closeRegistrationForm,
  getRegistrationSubmissions,
  getRegistrationSubmissionById,
  approveRegistrationSubmission,
  rejectRegistrationSubmission,
  assignMentor,
  exportReport,
  getMentors
} = require('../controllers/hodController');
const { protect } = require('../middleware/authMiddleware');

// Existing
router.get('/dashboard', protect, getHodStats); // Re-used for dashboard stats? Wait, prompt asked for /dashboard-stats. I will alias it.
router.get('/dashboard-stats', protect, getHodStats);
router.get('/projects', protect, getAllProjects);

// 1. Registration Forms
router.post('/registration-forms', protect, createRegistrationForm);
router.get('/registration-forms', protect, getRegistrationForms);
router.patch('/registration-forms/:id', protect, updateRegistrationForm);
router.patch('/registration-forms/:id/publish', protect, publishRegistrationForm);
router.patch('/registration-forms/:id/close', protect, closeRegistrationForm);

// 2. Submissions
router.get('/registration-submissions', protect, getRegistrationSubmissions);
router.get('/registration-submissions/:id', protect, getRegistrationSubmissionById);
router.patch('/registration-submissions/:id/approve', protect, approveRegistrationSubmission);
router.patch('/registration-submissions/:id/reject', protect, rejectRegistrationSubmission);

// 3. Mentor Assignment
router.post('/assign-mentor', protect, assignMentor);

// 4. Mentors
router.get('/mentors', protect, getMentors);

// 5. Export
router.get('/export-report', protect, exportReport);

module.exports = router;
