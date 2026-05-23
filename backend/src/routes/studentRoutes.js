const express = require('express');
const router = express.Router();
const { 
  getProfile,
  updateProfile,
  getActiveRegistrationForms,
  getStudentTimeline,
  submitRegistrationForm,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/registration-forms/active', protect, getActiveRegistrationForms);
router.post('/registration-forms/:id/submit', protect, submitRegistrationForm);
router.get('/timeline', protect, getStudentTimeline);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/read-all', protect, markAllNotificationsAsRead);
router.patch('/notifications/:id/read', protect, markNotificationAsRead);

module.exports = router;
