const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/examController');

router.route('/')
  .post(protect, authorize('admin'), ctrl.createExam)
  .get(protect, ctrl.getExams);
  router.get('/:id', protect, ctrl.getExamById);

router.route('/:id')
  .put(protect, authorize('admin'), ctrl.updateExam)
  .delete(protect, authorize('admin'), ctrl.deleteExam);

// Teacher and student specific
router.get('/teacher/mine', protect, authorize('teacher'), ctrl.getTeacherExams);
router.get('/student/mine', protect, authorize('student'), ctrl.getStudentExams);

module.exports = router;