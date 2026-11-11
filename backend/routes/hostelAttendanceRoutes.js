const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  getResidentsForAttendance,
} = require('../controllers/hostelAttendanceController');

// Warden routes
router.get('/residents', protect, authorize('warden'), getResidentsForAttendance);
router.post('/', protect, authorize('warden'), markAttendance);
router.get('/', protect, authorize('warden', 'admin'), getAttendanceByDate);

// Student / Parent route
router.get('/my', protect, authorize('student', 'parent'), getStudentAttendance);

module.exports = router;