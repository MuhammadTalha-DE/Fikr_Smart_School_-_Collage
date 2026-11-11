const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/setupController');

router.post('/teacher-availability', protect, authorize('admin'), ctrl.setTeacherAvailability);
router.post('/weekly-load', protect, authorize('admin'), ctrl.setWeeklyLoad);
router.get('/teacher-availability/:teacherId', protect, ctrl.getTeacherAvailability);
router.get('/weekly-load/:classId', protect, ctrl.getWeeklyLoad);

module.exports = router;