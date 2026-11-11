const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Teacher = require('../models/Teacher');
const ctrl = require('../controllers/teacherController');

// All routes protected
router.use(protect);

// â”€â”€â”€ /me â€“ MUST be first â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/me', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('classes', 'name')
      .populate('subjects', 'name code credits type')
      .populate('userId', 'name email avatar');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    res.json(teacher);
  } catch (err) {
    throw err;
  }
});

// â”€â”€â”€ /schedule â€“ MUST be before /:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/schedule', ctrl.getTeacherSchedule);

// â”€â”€â”€ List all teachers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', authorize('admin', 'teacher'), ctrl.getAllTeachers);

// â”€â”€â”€ Single teacher by ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/:id', ctrl.getTeacherById);

// â”€â”€â”€ Update teacher (admin only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:id', authorize('admin'), ctrl.updateTeacher);

// â”€â”€â”€ Delete teacher (admin only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/:id', authorize('admin'), ctrl.deleteTeacher);

module.exports = router;
