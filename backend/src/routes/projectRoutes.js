const express = require('express');
const router = express.Router();
const { getProjects, createProject, getProjectById } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('student', 'admin'), createProject);

router.route('/:id')
  .get(protect, getProjectById);

module.exports = router;
