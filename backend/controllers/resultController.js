const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const GradeScale = require('../models/GradeScale');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');

// Helper: Calculate grade and GPA from percentage
const getGrade = async (percentage) => {
  const scales = await GradeScale.find().sort('minPercentage');
  for (const scale of scales) {
    if (percentage >= scale.minPercentage && percentage <= scale.maxPercentage) {
      return { grade: scale.letter, gpa: scale.gpa };
    }
  }
  return { grade: 'F', gpa: 0.0 };
};

// @desc    Publish / Re‑publish results for an exam
// @route   POST /api/results/exams/:examId/publish-results
const publishResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId).populate('classId');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // 1. Remove old results (safe re‑publish)
  await Result.deleteMany({ examId: exam._id });

  const students = await Student.find({ classId: exam.classId._id }).lean();
  if (students.length === 0) {
    return res.json({
      message: 'No students enrolled in this class. Results not created.',
    });
  }

  // 2. Fetch all marks for this exam in one query
  const allMarks = await Marks.find({ examId: exam._id }).lean();

  const results = [];

  for (const student of students) {
    const subjectResults = [];
    let totalObtained = 0;
    let totalMax = 0;

    for (const subject of exam.subjects) {
      // First try direct examId match
      const mark = allMarks.find(
        m =>
          m.studentId.toString() === student._id.toString() &&
          m.subject === subject
      );

      // If not found, fallback to your original logic (match by examType name)
      if (mark) {
        const percentage = (mark.marksObtained / mark.totalMarks) * 100;
        const { grade, gpa } = await getGrade(percentage);
        subjectResults.push({
          subject,
          marksObtained: mark.marksObtained,
          maxMarks: mark.totalMarks,
          percentage: Math.round(percentage * 10) / 10,
          grade,
          gpa,
        });
        totalObtained += mark.marksObtained;
        totalMax += mark.totalMarks;
      }
      // If no marks for this subject, skip (won't affect GPA)
    }

    // Skip students with no marks at all
    if (totalMax === 0) continue;

    const overallPercentage = (totalObtained / totalMax) * 100;
    const { grade: overallGrade } = await getGrade(overallPercentage);
    const overallGPA =
      subjectResults.length > 0
        ? subjectResults.reduce((sum, sub) => sum + sub.gpa, 0) / subjectResults.length
        : 0;

    results.push({
      studentId: student._id,
      examId: exam._id,
      subjectResults,
      totalMarksObtained: totalObtained,
      totalMaxMarks: totalMax,
      overallPercentage: Math.round(overallPercentage * 10) / 10,
      overallGrade,
      overallGPA: Math.round(overallGPA * 100) / 100,
      published: true,
    });
  }

  if (results.length === 0) {
    return res.json({
      message: 'No marks found for any student. Results not created.',
    });
  }

  // Sort by overall percentage descending → assign rank
  results.sort((a, b) => b.overallPercentage - a.overallPercentage);
  results.forEach((r, idx) => {
    r.classRank = idx + 1;
  });

  await Result.insertMany(results);

  res.json({
    message: `Results published for ${results.length} students`,
    count: results.length,
  });
});

// @desc    Get results for a student (self‑service)
// @route   GET /api/results/mine
const getMyResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.json([]);

  const results = await Result.find({ studentId: student._id, published: true })
    .populate('examId', 'name classId date')
    .sort('-createdAt');
  res.json(results);
});

// @desc    Get all results for an exam (Teacher/Admin)
// @route   GET /api/results/exams/:examId/results
const getExamResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ examId: req.params.examId })
    .populate('studentId', 'userId rollNumber')
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name avatar' } })
    .sort('classRank');
  res.json(results);
});

// @desc    Reset (delete) all results for an exam
// @route   DELETE /api/results/exams/:examId/reset
const resetResults = asyncHandler(async (req, res) => {
  const { deletedCount } = await Result.deleteMany({
    examId: req.params.examId,
  });
  if (deletedCount === 0) {
    return res.json({ message: 'No results to delete.' });
  }
  res.json({ message: `Deleted ${deletedCount} result(s).` });
});

// @desc    Toggle single result visibility (publish/unpublish)
// @route   PUT /api/results/:id/publish
const togglePublish = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) {
    res.status(404);
    throw new Error('Result not found');
  }
  result.published = !result.published;
  await result.save();
  res.json(result);
});

module.exports = {
  publishResults,
  getMyResults,
  getExamResults,
  resetResults,
  togglePublish,
};