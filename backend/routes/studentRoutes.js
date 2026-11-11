/*
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  getStudentAttendance,
  getStudentMarks,
  getStudentNotes,
  addStudentNote,
  getStudentActivity
} = require('../controllers/studentController');

const router = express.Router();

router.get('/', protect, authorize('admin', 'teacher'), getAllStudents);
router.get('/:id', protect, authorize('admin', 'teacher'), getStudentById);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.get('/:id/attendance', protect, authorize('admin', 'teacher', 'parent'), getStudentAttendance);
router.get('/:id/marks', protect, authorize('admin', 'teacher', 'parent'), getStudentMarks);

router.get('/:id/notes', protect, authorize('admin', 'teacher'), getStudentNotes);
router.post('/:id/notes', protect, authorize('admin', 'teacher'), addStudentNote);
router.get('/:id/activity', protect, authorize('admin', 'teacher'), getStudentActivity);


module.exports = router;


*/
const express = require('express');

const Student =  require('../models/Student')
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  getStudentAttendance,
  getStudentMarks,
  getStudentNotes,
  addStudentNote,
  getStudentActivity,
  createStudent,
  deleteStudent ,
} = require('../controllers/studentController');

const router = express.Router(); //   that  cearte a  router 

router.use(protect); //   that   provide  protection  as well  

router.get('/me', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('classId', 'name');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (err) {
    throw err;
  }
});



// Base student routes
router.get('/', protect, authorize('admin', 'teacher'), getAllStudents);
router.get('/:id', protect, authorize('admin', 'teacher', 'parent'), getStudentById);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

router.post('/:id',protect , authorize('admin'),createStudent);

// Student specific data
router.get('/:id/attendance', protect, authorize('admin', 'teacher', 'parent'), getStudentAttendance);
router.get('/:id/marks', protect, authorize('admin', 'teacher', 'parent'), getStudentMarks);
router.get('/:id/notes', protect, authorize('admin', 'teacher'), getStudentNotes);
router.post('/:id/notes', protect, authorize('admin', 'teacher'), addStudentNote);
router.get('/:id/activity', protect, authorize('admin', 'teacher'), getStudentActivity);


// GET /api/students/me
/*router.get('/me', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('classId', 'name');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    res.json(student);
  } catch (err) {
    throw err;
  }
}); */
module.exports = router;

