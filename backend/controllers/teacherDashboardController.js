const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const LessonPlan = require('../models/LessonPlan');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');

// GET /api/teacher/pending-assignments
const pendingAssignments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return res.json({ count: 0 });

  const count = await Assignment.countDocuments({
    teacher: teacher._id,
    dueDate: { $gte: new Date() },
    'submissions.0': { $exists: false },
  });
  res.json({ count });
});

// GET /api/teacher/upcoming-exams
const upcomingExams = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return res.json([]);

  const teacherClasses = teacher.classes || [];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const exams = await Exam.find({
    classId: { $in: teacherClasses },
    date: { $gte: new Date(), $lte: sevenDaysLater },
  })
    .populate('classId', 'name')
    .sort({ date: 1 })
    .lean();

  res.json(exams);
});

// GET /api/teacher/recent-lessons
const recentLessons = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return res.json([]);

  const plans = await LessonPlan.find({ teacher: teacher._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('subject', 'name')
    .lean();

  res.json(plans);
});

module.exports = { pendingAssignments, upcomingExams, recentLessons };