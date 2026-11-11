const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getStudentIdCard, getTeacherIdCard, bulkStudentIdCards } = require('../controllers/idCardController');
const router = express.Router();

router.get('/student/:id', protect, authorize('admin'), getStudentIdCard);
router.get('/teacher/:id', protect, authorize('admin'), getTeacherIdCard);
router.post('/bulk-students', protect, authorize('admin'), bulkStudentIdCards);

module.exports = router;