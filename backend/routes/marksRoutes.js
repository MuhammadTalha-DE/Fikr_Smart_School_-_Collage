const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/marksController');

router.use(protect);

// GET /api/marks?classId=...&subject=...&examType=...
router.get('/', ctrl.getMarks);

// POST /api/marks/save (safe upsert)
router.post('/save', authorize('teacher', 'admin'), ctrl.saveMarks);

// If you have a single update/delete, add them with the exact function names from your controller.
// For now, we only keep the two that are guaranteed to exist.

module.exports = router;