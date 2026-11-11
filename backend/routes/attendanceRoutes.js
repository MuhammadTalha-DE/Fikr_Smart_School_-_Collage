const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  markAttendance,
  getAttendance,
  getStudentAttendanceStats,
  getTodayStats,
  getLowAttendanceStudents,
  getClassAttendanceSummary,
  getMonthlyTrends,
  getAttendanceRiskAnalysis,
  generateAttendanceRecommendations,
  bulkImportAttendance,
} = require('../controllers/attendanceController');

const {
  markTeacherAttendance,
  getTeacherAttendance,
  getTeacherStats,
  teacherCheckIn,
  teacherCheckOut,
} = require('../controllers/teacherAttendanceController');

const {
  markTransportAttendance,
  getTransportAttendance,
  getTransportStats,
  getMyTransportAttendance,
} = require('../controllers/transportAttendanceController');

const router = express.Router();

// ============= STUDENT ATTENDANCE =============
router.route('/')
  .post(protect, authorize('teacher', 'admin'), markAttendance)
  .get(protect, getAttendance);

router.post('/bulk', protect, authorize('admin'), bulkImportAttendance);
router.get('/stats/today', protect, authorize('admin'), getTodayStats);
router.get('/stats/low-attendance', protect, authorize('admin'), getLowAttendanceStudents);
router.get('/stats/risk-analysis', protect, authorize('admin', 'teacher'), getAttendanceRiskAnalysis);
router.get('/stats/monthly-trends', protect, authorize('admin', 'teacher'), getMonthlyTrends);
router.get('/stats/student/:studentId', protect, getStudentAttendanceStats);
router.get('/stats/class/:classId', protect, authorize('admin', 'teacher'), getClassAttendanceSummary);
router.post('/recommendations', protect, authorize('admin'), generateAttendanceRecommendations);

// ============= TEACHER ATTENDANCE =============
router.get('/teacher', protect, authorize('admin', 'teacher'), getTeacherAttendance);
router.post('/teacher', protect, authorize('admin', 'teacher'), markTeacherAttendance);
router.get('/teacher/stats', protect, authorize('admin', 'teacher'), getTeacherStats);
router.post('/teacher/check-in', protect, authorize('teacher'), teacherCheckIn);
router.post('/teacher/check-out', protect, authorize('teacher'), teacherCheckOut);

// ============= TRANSPORT ATTENDANCE =============
router.get('/transport', protect, getTransportAttendance);
router.post('/transport', protect, authorize('admin', 'teacher'), markTransportAttendance);
router.get('/transport/stats', protect, authorize('admin'), getTransportStats);
router.get('/transport/my', protect, authorize('student'), getMyTransportAttendance);

module.exports = router;
