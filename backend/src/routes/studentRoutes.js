const express = require('express');
const router = express.Router();
const { 
  getActiveRegistrationForms,
  submitRegistrationForm,
  getNotifications,
  markNotificationAsRead
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/registration-forms/active', protect, getActiveRegistrationForms);
router.post('/registration-forms/:id/submit', protect, submitRegistrationForm);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markNotificationAsRead);

module.exports = router;
