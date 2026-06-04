const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  getMentorStats,
  getReviewQueue,
  getAssignedProjects,
  getAllocatedStudents,
  createMentorMilestones,
  updateMentorMilestone,
  uploadMilestoneTemplate,
  getProjectTemplates,
  updateProjectTemplate,
  deleteProjectTemplate,
  getProjectSubmissions,
  upsertContribution,
  createMeetingLog,
  getDocumentVersions
} = require('../controllers/mentorController');
const { reviewMilestoneSubmission } = require('../controllers/milestoneController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/templates');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
const templateUpload = upload.fields([
  { name: 'template_file', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

router.get('/dashboard', protect, authorize('mentor', 'hod', 'admin'), getMentorStats);
router.get('/reviews', protect, authorize('mentor', 'hod', 'admin'), getReviewQueue);
router.get('/assigned-projects', protect, authorize('mentor', 'hod', 'admin'), getAssignedProjects);
router.get('/allocated-students', protect, authorize('mentor', 'hod', 'admin'), getAllocatedStudents);
router.get('/students', protect, authorize('mentor', 'hod', 'admin'), getAllocatedStudents);
router.get('/teams', protect, authorize('mentor', 'hod', 'admin'), getAssignedProjects);
router.post('/milestones', protect, authorize('mentor', 'hod', 'admin'), createMentorMilestones);
router.patch('/milestones/:id', protect, authorize('mentor', 'hod', 'admin'), updateMentorMilestone);
router.post('/templates/upload', protect, authorize('mentor', 'hod', 'admin'), templateUpload, uploadMilestoneTemplate);
router.get('/templates/:projectId', protect, authorize('mentor', 'hod', 'admin'), getProjectTemplates);
router.patch('/templates/:id', protect, authorize('mentor', 'hod', 'admin'), templateUpload, updateProjectTemplate);
router.delete('/templates/:id', protect, authorize('mentor', 'hod', 'admin'), deleteProjectTemplate);
router.get('/project/:id/submissions', protect, authorize('mentor', 'hod', 'admin'), getProjectSubmissions);
router.patch('/submissions/:id/review', protect, authorize('mentor', 'hod', 'admin'), reviewMilestoneSubmission);
router.post('/contribution', protect, authorize('mentor', 'hod', 'admin'), upsertContribution);
router.post('/meeting-log', protect, authorize('mentor', 'hod', 'admin'), createMeetingLog);
router.get('/submissions/:id/versions', protect, authorize('mentor', 'hod', 'admin'), getDocumentVersions);

module.exports = router;
