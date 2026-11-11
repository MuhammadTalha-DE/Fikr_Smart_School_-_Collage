const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAttendanceTrends,
  getMarksDistribution,
  getTeacherPerformance,
  getFilterOptions,
} = require('../controllers/analyticsController');
const router = express.Router();

router.get('/attendance-trends', protect, authorize('admin'), getAttendanceTrends);
router.get('/marks-distribution', protect, authorize('admin'), getMarksDistribution);
router.get('/teacher-performance', protect, authorize('admin'), getTeacherPerformance);
router.get('/filters', protect, authorize('admin'), getFilterOptions);

module.exports = router;