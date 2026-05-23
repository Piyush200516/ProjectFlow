const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markNotificationAsRead);
router.patch('/read-all', protect, markAllNotificationsAsRead);
router.put('/read-all', protect, markAllNotificationsAsRead);

module.exports = router;
