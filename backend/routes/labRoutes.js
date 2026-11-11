const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/labController');

// Labs
router.post('/labs', protect, authorize('admin', 'teacher'), ctrl.createLab);
router.get('/labs', protect, ctrl.getLabs);


router.put('/labs/:id', protect, authorize('admin'), ctrl.updateLab);
router.delete('/labs/:id', protect, authorize('admin'), ctrl.deleteLab);

// Lab Sessions
router.post('/sessions', protect, authorize('admin','teacher'), ctrl.createLabSession);
router.get('/sessions', protect, ctrl.getLabSessions);

router.delete('/sessions/:id', protect, authorize('admin', 'teacher'), ctrl.deleteLabSession);

// Lab Attendance
router.post('/sessions/attendance', protect, authorize('teacher'), ctrl.markLabAttendance);
router.get('/sessions/:sessionId/attendance', protect, ctrl.getLabAttendance);

// Practical Marks
router.post('/marks', protect, authorize('teacher'), ctrl.addPracticalMarks);
router.get('/marks', protect, ctrl.getPracticalMarks);
router.get('/projects/:id', protect, ctrl.getProjectById);
// Projects
router.post('/projects', protect, authorize('teacher'), ctrl.createProject);
router.get('/projects', protect, ctrl.getProjects);
router.post('/projects/submit', protect, authorize('student'), ctrl.submitProject);
router.get('/projects/:projectId/submissions', protect, ctrl.getProjectSubmissions);
router.put('/projects/submissions/grade', protect, authorize('teacher'), ctrl.gradeProject);
router.get('/sessions/:sessionId', protect, ctrl.getLabSessionById);
// Student‑specific routes
router.get('/student/sessions', protect, authorize('student'), ctrl.getStudentLabSessions);
router.get('/student/submissions', protect, authorize('student'), ctrl.getMyProjectSubmissions);

module.exports = router;