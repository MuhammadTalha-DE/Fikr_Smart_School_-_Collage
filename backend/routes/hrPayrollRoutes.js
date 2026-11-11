const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/hrPayrollController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/admin/overview', controller.getAdminOverview);
router.get('/admin/staff', controller.getStaffDirectory);
router.get('/admin/attendance', controller.getAttendanceCenter);
router.get('/admin/payroll', controller.getPayrollCenter);

module.exports = router;
