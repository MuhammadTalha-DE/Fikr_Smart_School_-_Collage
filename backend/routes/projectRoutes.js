const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/projectController');   // adjust if your controller name is different

// ─── All routes require a valid token ─────────────────
router.use(protect);

// ─── STUDENT SELF‑SERVICE (no role restriction) ────────
router.get('/my', ctrl.getMyProjects);                // list projects for the logged‑in student
router.post('/:projectId/submit', ctrl.submitProject); // submit work to a project

// ─── TEACHER / ADMIN MANAGEMENT ───────────────────────
router.get('/', authorize('admin', 'teacher'), ctrl.getAllProjects);
router.post('/', authorize('admin', 'teacher'), ctrl.createProject);
router.put('/:id', authorize('admin', 'teacher'), ctrl.updateProject);
router.delete('/:id', authorize('admin', 'teacher'), ctrl.deleteProject);

// ─── TEACHER VIEWS SUBMISSIONS ────────────────────────
router.get('/:projectId/submissions', authorize('admin', 'teacher'), ctrl.getSubmissions);

module.exports = router;