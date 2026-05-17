const express = require('express');
const router = express.Router();
const { 
  inviteMember, 
  getInvitations, 
  acceptInvitation, 
  rejectInvitation, 
  getTeamProject,
  getNotifications,
  markAllRead
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.post('/invite', protect, inviteMember);
router.get('/invitations', protect, getInvitations);
router.post('/accept', protect, acceptInvitation);
router.post('/reject', protect, rejectInvitation);
router.get('/project/:projectId', protect, getTeamProject);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllRead);

module.exports = router;
