const express = require('express');
const router = express.Router();
const { 
  getHodStats, 
  getAllProjects,
  getStudents,
  createRegistrationForm,
  getRegistrationForms,
  updateRegistrationForm,
  publishRegistrationForm,
  closeRegistrationForm,
  createRegistrationFormTimeline,
  getRegistrationSubmissions,
  getRegistrationSubmissionById,
  approveRegistrationSubmission,
  rejectRegistrationSubmission,
  assignMentor,
  exportReport,
  getMentors
} = require('../controllers/hodController');
const { protect, authorize } = require('../middleware/authMiddleware');

const hodOnly = [protect, authorize('hod', 'admin')];

router.get('/dashboard', ...hodOnly, getHodStats);
router.get('/dashboard-stats', ...hodOnly, getHodStats);
router.get('/projects', ...hodOnly, getAllProjects);
router.get('/students', ...hodOnly, getStudents);

// 1. Registration Forms
router.post('/registration-forms', ...hodOnly, createRegistrationForm);
router.get('/registration-forms', ...hodOnly, getRegistrationForms);
router.patch('/registration-forms/:id', ...hodOnly, updateRegistrationForm);
router.patch('/registration-forms/:id/publish', ...hodOnly, publishRegistrationForm);
router.patch('/registration-forms/:id/close', ...hodOnly, closeRegistrationForm);
router.post('/registration-forms/:formId/timeline', ...hodOnly, createRegistrationFormTimeline);

// 2. Submissions
router.get('/registration-submissions', ...hodOnly, getRegistrationSubmissions);
router.get('/registration-submissions/:id', ...hodOnly, getRegistrationSubmissionById);
router.patch('/registration-submissions/:id/approve', ...hodOnly, approveRegistrationSubmission);
router.patch('/registration-submissions/:id/reject', ...hodOnly, rejectRegistrationSubmission);

// 3. Mentor Assignment
router.post('/assign-mentor', ...hodOnly, assignMentor);

// 4. Mentors
router.get('/mentors', ...hodOnly, getMentors);

// 5. Export
router.get('/export-report', ...hodOnly, exportReport);

module.exports = router;
