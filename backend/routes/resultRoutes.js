const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/resultController');

// Publish / Re‑publish results for an exam (teacher/admin)
router.post(
  '/exams/:examId/publish-results',
  protect,
  authorize('teacher', 'admin'),
  ctrl.publishResults
);

// Get exam results (teacher/admin)
router.get(
  '/exams/:examId/results',
  protect,
  authorize('teacher', 'admin'),
  ctrl.getExamResults
);

// Reset (delete) all results for an exam (teacher/admin)
router.delete(
  '/exams/:examId/reset',
  protect,
  authorize('teacher', 'admin'),
  ctrl.resetResults
);

// Get own results (student/parent)
router.get('/mine', protect, ctrl.getMyResults);

// Toggle single result publish (admin)
router.put(
  '/:id/publish',
  protect,
  authorize('admin'),
  ctrl.togglePublish
);

module.exports = router;