const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/syllabusController');

router.use(protect);
router.get('/', ctrl.getUnits);
router.post('/', authorize('admin'), ctrl.createUnit);
router.post('/bulk', authorize('admin'), ctrl.bulkCreateUnits);   // for syllabus builder
router.put('/:id', authorize('admin'), ctrl.updateUnit);
router.delete('/:id', authorize('admin'), ctrl.deleteUnit);

module.exports = router;