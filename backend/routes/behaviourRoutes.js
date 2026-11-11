const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/behaviourController');

router.use(protect);

// Categories (any authenticated user can view)
router.get('/categories', ctrl.getCategories);

// Teacher logs behaviour
router.post('/log', authorize('teacher', 'admin'), ctrl.logBehaviour);

// Teacher views logs (filtered)
router.get('/logs', authorize('teacher', 'admin'), ctrl.getLogs);

// Student merit summary
router.get('/student/:studentId/summary', authorize('teacher', 'admin', 'student', 'parent'), ctrl.getStudentSummary);

// Student views own logs
router.get('/my', ctrl.getMyLogs);
// Student views own merit summary
router.get('/my-summary', ctrl.getMySummary);                    // new

// Student views class behaviour stats
router.get('/class-stats', ctrl.getClassBehaviourStats); 

// Parent views child's logs
router.get('/child/:childId/logs', authorize('parent'), ctrl.getChildLogs);  // new

// Parent views child's merit summary
router.get('/child/:childId/summary', authorize('parent'), ctrl.getChildSummary); // new
// Activity tracking
router.post('/activity/log', authorize('teacher', 'admin'), ctrl.logActivity);
router.get('/activity/logs', authorize('teacher', 'admin'), ctrl.getActivityLogs);
router.get('/activity/my', ctrl.getMyActivities);

// Thresholds & Alerts
router.get('/thresholds', ctrl.getThresholds);
router.get('/alerts', authorize('teacher', 'admin'), ctrl.getAlerts);

// Reports
router.get('/report/class/:classId', authorize('teacher', 'admin'), ctrl.getClassReport);
router.get('/school-stats', authorize('admin'), ctrl.getSchoolStats);
router.delete('/activity/:id', authorize('teacher', 'admin'), ctrl.deleteActivity);

module.exports = router;