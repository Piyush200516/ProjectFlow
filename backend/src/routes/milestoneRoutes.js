const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createTimeline,
  getStudentTimeline,
  getProjectTimeline,
  submitMilestone
} = require('../controllers/milestoneController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

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
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post('/timeline', protect, authorize('mentor', 'hod', 'admin'), createTimeline);
router.get('/student/timeline', protect, authorize('student'), getStudentTimeline);
router.get('/project/:projectId/timeline', protect, authorize('mentor', 'hod', 'admin'), getProjectTimeline);
router.post('/:milestoneId/submit', protect, authorize('student'), upload.single('file'), submitMilestone);

module.exports = router;
