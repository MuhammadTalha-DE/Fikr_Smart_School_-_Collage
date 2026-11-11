const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/timetableReportController');

router.get('/class/pdf', protect, authorize('admin'), ctrl.downloadPDF);
router.get('/class/excel', protect, authorize('admin'), ctrl.downloadExcel);
router.get('/teacher/pdf', protect, authorize('admin'), ctrl.downloadTeacherPDF);
router.get('/teacher/excel', protect, authorize('admin'), ctrl.downloadTeacherExcel);

module.exports = router;
