const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProjectForm,
  getProjectForms,
  getProjectSubmissions,
  assignMentor,
  getActiveForms,
  submitProjectForm,
  uploadDocumentTemplate,
  setDocumentDeadline,
  getDeadlines,
  submitDocument,
  reviewSubmission,
  getStudentMarks,
  getMentorsList,
  getMentorSubmissions,
  getGlobalSubmissionTracking,
  getStudentActiveStatus
} = require('../controllers/workflowController');

// HOD Routes
router.post('/hod/forms', protect, authorize('hod'), createProjectForm);
router.get('/hod/forms', protect, authorize('hod'), getProjectForms);
router.get('/hod/submissions', protect, authorize('hod'), getProjectSubmissions);
router.post('/hod/assign-mentor', protect, authorize('hod'), assignMentor);
router.get('/hod/mentors', protect, authorize('hod'), getMentorsList);
router.get('/hod/tracking', protect, authorize('hod'), getGlobalSubmissionTracking);

// Student Routes
router.get('/student/forms/active', protect, authorize('student'), getActiveForms);
router.post('/student/forms/submit', protect, authorize('student'), submitProjectForm);
router.post('/student/documents/submit', protect, authorize('student'), submitDocument);
router.get('/student/active-status', protect, authorize('student'), getStudentActiveStatus);

// Shared / Deadlines & Marks
router.get('/projects/deadlines', protect, getDeadlines);
router.get('/projects/marks', protect, getStudentMarks);

// Mentor Routes
router.post('/mentor/document-templates', protect, authorize('mentor', 'hod'), uploadDocumentTemplate);
router.post('/mentor/deadlines', protect, authorize('mentor', 'hod'), setDocumentDeadline);
router.get('/mentor/submissions', protect, authorize('mentor'), getMentorSubmissions);
router.post('/mentor/submissions/:id/review', protect, authorize('mentor'), reviewSubmission);

module.exports = router;
