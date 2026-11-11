const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');   // ✅ ADD THIS LINE
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const asyncHandler = require('express-async-handler');
// @desc    Create a class (Admin only)
// @route   POST /api/classes
const createClass = asyncHandler(async (req, res) => {
  let { name, teacherId, subjects } = req.body;

  // Convert empty string to null
  if (teacherId === '') teacherId = null;

  const newClass = await Class.create({ name, teacherId, subjects });

  if (teacherId) {
    await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { classes: newClass._id } });
  }

  res.status(201).json(newClass);
});

// @desc    Get all classes
// @route   GET /api/classes
const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({})
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } });
  res.json(classes);
});

// @desc    Get classes assigned to logged-in teacher
// @route   GET /api/classes/my-classes
const getMyClasses = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }
  const classes = await Class.find({ _id: { $in: teacher.classes } });
  res.json(classes);
});

// @desc    Get students of a class
// @route   GET /api/classes/:id/students
 const getClassStudents = asyncHandler(async (req, res) => {
  const classData = await Class.findById(req.params.id)
    .populate({
      path: 'students',
      populate: [
        { path: 'userId', select: 'name email  avatar' },
        { 
          path: 'parentId',
          populate: { 
            path: 'userId', 
            select: 'name email avatar' 
          }
        }
      ]
    });
  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }
  res.json(classData.students);
});


/*const getClassStudents = asyncHandler(async (req, res) => {
  const classData = await Class.findById(req.params.id)
    .populate({
      path: 'students',
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'parentId', populate: { path: 'userId', select: 'name email' } }
      ]
    });
  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }
  res.json(classData.students);
});*/

// @desc    Update a class
// @route   PUT /api/classes/:id
const updateClass = asyncHandler(async (req, res) => {
  const { name, teacherId, subjects } = req.body;
  //let newTeacherId = teacherId === '' ? null : teacherId; // Convert empty string to null
  let newTeacherId = teacherId;
  if (newTeacherId === '') newTeacherId = null;
  const classData = await Class.findById(req.params.id);

  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }

  // If teacher is changing, update old and new teacher records
  if (teacherId && classData.teacherId?.toString() !== teacherId) {
    // Remove class from old teacher
    if (classData.teacherId) {
      await Teacher.findByIdAndUpdate(classData.teacherId, {
        $pull: { classes: classData._id }
      });
    }
    // Add class to new teacher
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { classes: classData._id }
    });
  }

  classData.name = name || classData.name;
  classData.teacherId = teacherId || classData.teacherId;
  classData.subjects = subjects || classData.subjects;

  const updatedClass = await classData.save();
  res.json(updatedClass);
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @desc    Delete a class and cleanup all references
// @route   DELETE /api/classes/:id
const deleteClass = asyncHandler(async (req, res) => {
  const classId = req.params.id;

  // Find the class
  const classData = await Class.findById(classId);
  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }

  // 1. Remove class reference from teacher
  if (classData.teacherId) {
    await Teacher.findByIdAndUpdate(classData.teacherId, {
      $pull: { classes: classId }
    });
  }

  // 2. Remove classId from all students in this class
  await Student.updateMany(
    { classId: classId },
    { $unset: { classId: "" } }
  );

  // 3. Delete all attendance records for this class
  await Attendance.deleteMany({ classId: classId });

  // 4. Delete all marks records for this class
  await Marks.deleteMany({ classId: classId });

  // 5. Delete all assignments for this class
  await Assignment.deleteMany({ classId: classId });

  // 6. Remove class reference from announcements (optional, set to null)
  await Announcement.updateMany(
    { targetClass: classId },
    { $unset: { targetClass: "" } }
  );

  // Finally, delete the class itself
  await classData.deleteOne();

  res.json({ message: 'Class and all associated data removed successfully' });
});

// @desc    Add student to class
// @route   POST /api/classes/:id/students
const addStudentToClass = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const classData = await Class.findById(req.params.id);
  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }
  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  if (classData.students.includes(studentId)) {
    res.status(400);
    throw new Error('Student already in this class');
  }
  classData.students.push(studentId);
  await classData.save();
  student.classId = classData._id;
  await student.save();
  res.json({ message: 'Student added' });
});

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId

const removeStudentFromClass = asyncHandler(async (req, res) => {
  const { id, studentId } = req.params;

  console.log(`Removing student ${studentId} from class ${id}`);

  const classData = await Class.findById(id);
  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Remove student from class's students array
  classData.students = classData.students.filter(s => s.toString() !== studentId);
  await classData.save();

  // Remove class reference from student
  const student = await Student.findByIdAndUpdate(
    studentId,
    { $unset: { classId: "" } },
    { new: true }
  );

  if (!student) {
    console.warn(`Student ${studentId} not found, but class reference removed`);
  }

  res.json({ message: 'Student removed from class' });
});

// @desc    Get a single class by ID
// @route   GET /api/classes/:id
const getClassById = asyncHandler(async (req, res) => {
  const classData = await Class.findById(req.params.id)
    .populate('teacherId', 'userId subjects')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name email avatar ' } })
    .populate('students', 'userId rollNumber')
    .populate({ path: 'students', populate: { path: 'userId', select: 'name' } });

  if (!classData) {
    res.status(404);
    throw new Error('Class not found');
  }

  // If the user is a teacher, ensure they are assigned to this class
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || !teacher.classes.includes(classData._id.toString())) {
      res.status(403);
      throw new Error('You are not assigned to this class');
    }
  }

  res.json(classData);
});


// @desc    Get attendance summary for a class (last 30 days)
// @route   GET /api/classes/:id/attendance-summary
const getClassAttendanceSummary = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const records = await Attendance.find({
    classId: req.params.id,
    date: { $gte: thirtyDaysAgo },
  });

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  res.json({ total, present, percentage });
});
// @desc    Get recent marks for a class (last 5 entries)
// @route   GET /api/classes/:id/recent-marks
const getClassRecentMarks = asyncHandler(async (req, res) => {
  const marks = await Marks.find({ classId: req.params.id })
    .sort('-createdAt')
    .limit(10)
    .populate('studentId', 'userId rollNumber')
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } });
  res.json(marks);
});





// @desc    Add student to class
// @route   POST /api/classes/:id/students





module.exports = { createClass, getClasses,getClassById ,getMyClasses, getClassStudents , updateClass, deleteClass , addStudentToClass,         
  removeStudentFromClass,getClassAttendanceSummary,getClassRecentMarks };