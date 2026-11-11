const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/mcqController');

router.use(protect);

// Teacher CRUD
router.post('/', authorize('teacher', 'admin'), ctrl.createExam);
router.get('/', authorize('teacher', 'admin'), ctrl.getMyExams);
router.put('/:id', authorize('teacher', 'admin'), ctrl.updateExam);
router.delete('/:id', authorize('teacher', 'admin'), ctrl.deleteExam);
router.put('/:id/publish', authorize('teacher', 'admin'), ctrl.togglePublish);

// Teacher analytics
router.get('/:id/results', authorize('teacher', 'admin'), ctrl.getExamResults);
router.get('/:id/analytics', authorize('teacher', 'admin'), ctrl.getExamAnalytics);

// Student self‑service
router.get('/available', ctrl.getAvailableExams);
router.get('/:id/take', ctrl.getExamForStudent);
router.post('/:id/submit', ctrl.submitExam);
router.get('/:id/my-result', ctrl.getMyResult);

// Generic get by ID (keep last)
router.get('/:id', authorize('teacher', 'admin'), ctrl.getExamById);

module.exports = router;