const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/curriculumController');

router.use(protect);
router.get('/', ctrl.getCurriculums);
router.post('/', authorize('admin'), ctrl.createCurriculum);
router.put('/:id', authorize('admin'), ctrl.updateCurriculum);
router.delete('/:id', authorize('admin'), ctrl.deleteCurriculum);

module.exports = router;