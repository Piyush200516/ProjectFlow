const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { 
  getProfile,
  updateProfile,
  getActiveRegistrationForms,
  getRegistrationStatus,
  getMyProject,
  getDocumentWorkspace,
  submitMilestoneWorkspace,
  getTemplateDownload,
  getStudentMarks,
  getStudentCalendar,
  getStudentTimeline,
  submitRegistrationForm,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
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

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/update', protect, updateProfile);
router.get('/registration-forms/active', protect, getActiveRegistrationForms);
router.get('/registration-status', protect, getRegistrationStatus);
router.get('/my-project', protect, getMyProject);
router.get('/document-workspace', protect, getDocumentWorkspace);
router.post('/milestone-submit', protect, upload.single('file'), submitMilestoneWorkspace);
router.get('/templates/download', protect, getTemplateDownload);
router.get('/marks', protect, getStudentMarks);
router.get('/calendar', protect, getStudentCalendar);
router.post('/registration-forms/:id/submit', protect, submitRegistrationForm);
router.get('/timeline', protect, getStudentTimeline);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/read-all', protect, markAllNotificationsAsRead);
router.patch('/notifications/:id/read', protect, markNotificationAsRead);

module.exports = router;
