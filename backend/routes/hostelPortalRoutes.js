const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/hostelPortalController');

const router = express.Router();

router.use(protect);

router.get('/admin/overview', authorize('admin'), controller.getAdminOverview);
router.get('/warden/overview', authorize('warden'), controller.getWardenOverview);
router.get('/student/overview', authorize('student'), controller.getStudentOverview);
router.get('/student/status', authorize('student'), controller.getStudentStatus);
router.get('/parent/overview', authorize('parent'), controller.getParentOverview);

module.exports = router;
