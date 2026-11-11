const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student=  require('../models/Student');
const asyncHandler = require('express-async-handler');


// @desc    Create exam
// @route   POST /api/exams
const createExam = asyncHandler(async (req, res) => {
  const { name, classId, subjects, date, session, maxMarks } = req.body;
  const exam = await Exam.create({
    name, classId, subjects, date, session, maxMarks,
    createdBy: req.user._id,
  });
  res.status(201).json(exam);
});

// @desc    Get all exams (with filters)
// @route   GET /api/exams
const getExams = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { classId } : {};
  const exams = await Exam.find(filter)
    .populate('classId', 'name')
    .sort('-date');
  res.json(exams);
});

// @desc    Update exam
// @route   PUT /api/exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json(exam);
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  // Optionally remove marks linked to this exam (or keep them)
  await exam.deleteOne();
  res.json({ message: 'Exam deleted' });
});

// @desc    Get exams for logged-in teacher's classes
// @route   GET /api/exams/teacher
const getTeacherExams = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    return res.json([]);
  }
  const exams = await Exam.find({ classId: { $in: teacher.classes } })
    .populate('classId', 'name')
    .sort('date');
  res.json(exams);
});

// @desc    Get exams for logged-in student's class
// @route   GET /api/exams/student
const getStudentExams = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || !student.classId) {
    return res.json([]);
  }
  const exams = await Exam.find({ classId: student.classId })
    .populate('classId', 'name')
    .sort('date');
  res.json(exams);
});

// @desc    Get a single exam by ID with populated class
// @route   GET /api/exams/:id
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('classId', 'name')
    .populate('subjects'); // subjects is an array of strings, no ref needed
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json(exam);
});

module.exports = { createExam, getExams, updateExam, deleteExam, getTeacherExams, getStudentExams,getExamById };