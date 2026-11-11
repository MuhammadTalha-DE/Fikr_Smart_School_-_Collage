const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOccupancyStats,
  getTodayAttendance,
  getAttendanceTrend,
  getPendingApprovals,
  getComplaintSummary,
  getFeeCollection,
} = require('../controllers/hostelAnalyticsController');

router.get('/occupancy', protect, authorize('admin', 'warden'), getOccupancyStats);
router.get('/today-attendance', protect, authorize('admin', 'warden'), getTodayAttendance);
router.get('/attendance-trend', protect, authorize('admin', 'warden'), getAttendanceTrend);
router.get('/pending-approvals', protect, authorize('admin', 'warden'), getPendingApprovals);
router.get('/complaints', protect, authorize('admin'), getComplaintSummary);
router.get('/fees', protect, authorize('admin'), getFeeCollection);

module.exports = router;