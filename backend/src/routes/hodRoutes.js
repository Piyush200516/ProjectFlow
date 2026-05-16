const express = require('express');
const router = express.Router();
const { getHodStats, getAllProjects } = require('../controllers/hodController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getHodStats);
router.get('/projects', protect, getAllProjects);

module.exports = router;
