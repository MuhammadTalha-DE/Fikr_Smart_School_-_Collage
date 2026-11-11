const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/assignmentController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/assignments/', limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

// ─── Static / named routes FIRST ──────────────────────────────
router.route('/')
  .post(authorize('teacher', 'admin'), ctrl.createAssignment)
  .get(ctrl.getAssignments);

router.get('/my-submissions', ctrl.getMySubmissions);             // student self‑service

// 🔥 THIS MUST COME BEFORE /:id
router.put('/grade', authorize('teacher', 'admin'), ctrl.gradeSubmission);

// ─── Parameterized routes LAST ────────────────────────────────
router.get('/:id', ctrl.getAssignmentById);
router.put('/:id', authorize('teacher', 'admin'), ctrl.updateAssignment);
router.delete('/:id', authorize('teacher', 'admin'), ctrl.deleteAssignment);
router.post('/:id/submit', authorize('student'), upload.single('file'), ctrl.submitAssignment);
router.get('/:id/submissions', authorize('teacher', 'admin'), ctrl.getAssignmentSubmissions);

module.exports = router;