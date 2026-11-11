const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/teacherDashboardController');

router.use(protect);

router.get('/pending-assignments', ctrl.pendingAssignments);
router.get('/upcoming-exams', ctrl.upcomingExams);
router.get('/recent-lessons', ctrl.recentLessons);

module.exports = router;