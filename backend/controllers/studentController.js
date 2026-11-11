const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Parent = require('../models/Parent');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Guardian = require('../models/Guardian');
const StudentNote = require('../models/StudentNote');
const asyncHandler = require('express-async-handler');
const { getUserProfile } = require('./userController');

// @desc    Get all students with populated user info
// @route   GET /api/students
const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({})
    .populate('userId', 'name username email avatar')
    .populate('classId', 'name')
    .populate('parentId', 'userId')
    // .lean();
    .populate({ path: 'parentId', populate: { path: 'userId', select: 'name email' } });
    
  res.json(students);
});

// @desc    Get single student by ID
// @route   GET /api/students/:id
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('userId', 'name username email avatar')
    .populate('classId', 'name teacherId subjects')
    .populate({ path: 'classId', populate: { path: 'teacherId', populate: { path: 'userId', select: 'name' } } })
    .populate('parentId', 'userId')
    .populate({ path: 'parentId', populate: { path: 'userId', select: 'name email' } });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  // Attach guardians
  const guardians = await Guardian.find({ student: student._id }).lean();
  student.guardians = guardians || [];

  res.json(student);
});

// @desc    Update student details
// @route   PUT /api/students/:id
// @desc    Update student details
// @route   PUT /api/students/:id

const updateStudent = asyncHandler(async (req, res) => {
  console.log('\n--- UPDATE STUDENT DEBUG ---');
  console.log('req.body:', req.body);

  // 🔥 Extract all possible fields, including guardians and new profile fields
  const {
    name, email, rollNumber, classId, parentId,
    admissionNumber, admissionDate, dateOfBirth, gender,
    bloodGroup, address, medicalNotes, previousSchool, cnic, formBNumber,
    guardians,   // may be undefined – that's fine
  } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // 🔥 Update new profile fields (if present)
  const profileFields = { admissionNumber, admissionDate, dateOfBirth, gender, bloodGroup, address, medicalNotes, previousSchool, cnic, formBNumber };
  for (const [key, value] of Object.entries(profileFields)) {
    if (value !== undefined) {
      student[key] = value;
    }
  }

  console.log('Current student.parentId (before update):', student.parentId);

  // 1. Update user info (name, email)
  if (name || email) {
    const user = await User.findById(student.userId);
    if (!user) {
      res.status(404);
      throw new Error('Associated user not found');
    }
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    console.log('User info updated');
  }

  // 2. Update class if changed
  if (classId && String(student.classId) !== String(classId)) {
    // Remove from old class
    if (student.classId) {
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    }
    // Add to new class
    await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
    student.classId = classId;
    console.log('Class updated to:', classId);
  }

  // 3. Update parent with robust handling
  if (req.body.hasOwnProperty('parentId')) {
    let newParentId = req.body.parentId || null;
    console.log('Received parentId:', newParentId);

    if (newParentId) {
      let parentDoc = await Parent.findById(newParentId);
      if (!parentDoc) {
        console.log('Parent document not found – attempting to resolve via User ID');
        const user = await User.findById(newParentId);
        if (user && user.role === 'parent') {
          parentDoc = await Parent.findOne({ userId: user._id });
          if (!parentDoc) {
            parentDoc = await Parent.create({ userId: user._id });
            console.log('✅ Auto‑created missing Parent profile for user:', user.name);
          }
          newParentId = parentDoc._id;
          console.log('Resolved correct Parent ID:', newParentId);
        } else {
          res.status(400);
          throw new Error('Invalid parent ID – no such parent or user found');
        }
      } else {
        console.log('Valid Parent document found');
      }
    }

    console.log('Final newParentId:', newParentId);
    console.log('Comparing:', String(student.parentId), 'vs', String(newParentId));

    if (String(student.parentId) !== String(newParentId)) {
      console.log('Parent changed – updating references...');
      if (student.parentId) {
        await Parent.findByIdAndUpdate(student.parentId, { $pull: { children: student._id } });
        console.log('Removed from old parent:', student.parentId);
      }
      if (newParentId) {
        await Parent.findByIdAndUpdate(newParentId, { $addToSet: { children: student._id } });
        console.log('Added to new parent:', newParentId);
      }
      student.parentId = newParentId;
    } else {
      console.log('Parent unchanged – skipping update');
    }
  } else {
    console.log('parentId field not sent in request – keeping existing value');
  }

  // 4. Update roll number
  if (rollNumber !== undefined) {
    student.rollNumber = rollNumber;
  }

  // 5. Save the student document
  await student.save();
  console.log('Student saved to database');

  // 🔥 6. Update guardians ONLY if they were sent (not during inline edit)
  if (guardians !== undefined) {
    await Guardian.deleteMany({ student: student._id });
    if (guardians.length) {
      await Guardian.insertMany(
        guardians.map(g => ({ ...g, student: student._id }))
      );
    }
    console.log('Guardians updated');
  }

  // 7. Re‑fetch with full population to return complete data
  const updatedStudent = await Student.findById(student._id)
    .populate('userId', 'name username email avatar')
    .populate('classId', 'name teacherId subjects')
    .populate({
      path: 'classId',
      populate: { path: 'teacherId', populate: { path: 'userId', select: 'name' } }
    })
    .populate('parentId')
    .populate({
      path: 'parentId',
      populate: { path: 'userId', select: 'name email' }
    });

  // Also attach guardians to the returned object (so frontend can display them)
  const guardiansDocs = await Guardian.find({ student: student._id }).lean();
  updatedStudent._doc.guardians = guardiansDocs;

  console.log('Updated student parentId after populate:', updatedStudent.parentId);
  console.log('--- END DEBUG ---\n');

  res.json(updatedStudent);
});
const createStudent = asyncHandler(async (req, res) => {
  const { guardians, ...studentData } = req.body;

  const student = await Student.create(studentData);

  // If guardians are provided, create them
  if (guardians && guardians.length) {
    await Guardian.insertMany(
      guardians.map(g => ({ ...g, student: student._id }))
    );
  }

  res.status(201).json(student);
});


 
// @route   GET /api/students/:id/attendance
const getStudentAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const attendance = await Attendance.find({ studentId: student._id })
    .sort('-date')
    .populate('classId', 'name');

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = total - present;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  res.json({
    total,
    present,
    absent,
    percentage,
    records: attendance,
  });
});

// @desc    Get marks summary for a student
// @route   GET /api/students/:id/marks
const getStudentMarks = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const marks = await Marks.find({ studentId: student._id })
    .sort('-createdAt')
    .populate('classId', 'name');

  const subjectStats = {};
  marks.forEach(m => {
    if (!subjectStats[m.subject]) {
      subjectStats[m.subject] = { total: 0, count: 0, marks: [] };
    }
    subjectStats[m.subject].total += (m.marksObtained / m.totalMarks) * 100;
    subjectStats[m.subject].count += 1;
    subjectStats[m.subject].marks.push(m);
  });

  const averages = Object.keys(subjectStats).map(subject => ({
    subject,
    average: (subjectStats[subject].total / subjectStats[subject].count).toFixed(1),
    count: subjectStats[subject].count,
  }));

  res.json({
    allMarks: marks,
    subjectAverages: averages,
  });
});

// @desc    Get notes for a student
// @route   GET /api/students/:id/notes
const getStudentNotes = asyncHandler(async (req, res) => {
  const notes = await StudentNote.find({ studentId: req.params.id })
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.json(notes);
});


const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  await Guardian.deleteMany({ student: student._id });
  await Student.findByIdAndDelete(req.params.id);

  // Optionally delete the linked User account
  // await User.findByIdAndDelete(student.userId);

  res.json({ message: 'Student and guardians deleted' });
});

// @desc    Add a note for a student
// @route   POST /api/students/:id/notes
const addStudentNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note) {
    res.status(400);
    throw new Error('Note content is required');
  }
  const newNote = await StudentNote.create({
    studentId: req.params.id,
    note,
    createdBy: req.user._id,
  });
  res.status(201).json(newNote);
});

// @desc    Get activity timeline for a student
// @route   GET /api/students/:id/activity
const getStudentActivity = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  const attendance = await Attendance.find({ studentId })
    .sort('-date')
    .limit(10)
    .populate('classId', 'name')
    .lean();

  const marks = await Marks.find({ studentId })
    .sort('-createdAt')
    .limit(10)
    .lean();

  const notes = await StudentNote.find({ studentId })
    .sort('-createdAt')
    .limit(10)
    .populate('createdBy', 'name')
    .lean();

  const activities = [
    ...attendance.map(a => ({
      type: 'attendance',
      date: a.date,
      data: { status: a.status, class: a.classId?.name },
    })),
    ...marks.map(m => ({
      type: 'marks',
      date: m.createdAt,
      data: { subject: m.subject, examType: m.examType, marks: `${m.marksObtained}/${m.totalMarks}` },
    })),
    ...notes.map(n => ({
      type: 'note',
      date: n.createdAt,
      data: { note: n.note, author: n.createdBy?.name },
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  res.json(activities);
});

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  getStudentAttendance,
  getStudentMarks,
  getStudentNotes,
  addStudentNote,
  getStudentActivity,
  deleteStudent,
  getUserProfile,
  createStudent

};
