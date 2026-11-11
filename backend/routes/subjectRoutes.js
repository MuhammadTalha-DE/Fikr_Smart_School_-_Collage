const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/subjectController');

// All routes are protected
router.use(protect);

// GET all subjects (admin + teachers can view)
router.get('/', ctrl.getSubjects);

// POST (admin only)
router.post('/', authorize('admin'), ctrl.createSubject);

// PUT (admin only)
router.put('/:id', authorize('admin'), ctrl.updateSubject);

// DELETE (admin only)
router.delete('/:id', authorize('admin'), ctrl.deleteSubject);

module.exports = router;