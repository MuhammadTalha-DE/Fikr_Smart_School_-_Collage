
/*
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createClass, getClasses, getMyClasses, getClassStudents } = require('../controllers/classController');
const router = express.Router();
router.route('/').post(protect, authorize('admin'), createClass).get(protect, getClasses);
router.get('/my-classes', protect, authorize('teacher'), getMyClasses);
router.get('/:id/students', protect, getClassStudents);
module.exports = router;
*/const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createClass, getClasses,getClassById ,getMyClasses, getClassStudents,updateClass, deleteClass,  addStudentToClass,        // ⬅️ ADD
  removeStudentFromClass, getClassAttendanceSummary ,getClassRecentMarks} = require('../controllers/classController');
const router = express.Router();





router.route('/')
  .post(protect, authorize('admin'), createClass)
  .get(protect, getClasses);

router.get('/my-classes', protect, authorize('teacher'), getMyClasses);
router.get('/:id', protect, getClassById);
router.get('/:id/students', protect, getClassStudents);

router.get('/:id/attendance-summary', protect, authorize('admin', 'teacher'), getClassAttendanceSummary);

router.get('/:id/recent-marks', protect, authorize('admin', 'teacher'), getClassRecentMarks);
router.route('/:id')

 .put(protect, authorize('admin'), updateClass)
  .delete(protect, authorize('admin'), deleteClass)
  // Add student to class
router.post('/:id/students', protect, authorize('admin'), addStudentToClass);

// Remove student from class
router.delete('/:id/students/:studentId', protect, authorize('admin'), removeStudentFromClass);






module.exports = router;