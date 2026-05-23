const express = require('express');
const router = express.Router();
const { 
  getActiveRegistrationForms,
  submitRegistrationForm
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/registration-forms/active', protect, getActiveRegistrationForms);
router.post('/registration-forms/:id/submit', protect, submitRegistrationForm);

module.exports = router;
