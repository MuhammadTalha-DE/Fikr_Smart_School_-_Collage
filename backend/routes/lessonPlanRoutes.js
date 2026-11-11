const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/lessonPlanController');

router.use(protect);
router.get('/', ctrl.getLessonPlans);
router.post('/', authorize('admin', 'teacher'), ctrl.createLessonPlan);
router.put('/:id', authorize('admin', 'teacher'), ctrl.updateLessonPlan);
router.delete('/:id', authorize('admin'), ctrl.deleteLessonPlan);
router.post('/:id/complete', authorize('teacher'), ctrl.completeLessonPlan);

module.exports = router;