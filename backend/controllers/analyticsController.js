const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const Marks = require('../models/Marks');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');

// @desc    Get attendance trends over months
// @route   GET /api/analytics/attendance-trends
const getAttendanceTrends = asyncHandler(async (req, res) => {
  const { classId, startDate, endDate } = req.query;

  const match = {};
  if (classId) match.classId = mongoose.Types.ObjectId(classId);
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const trends = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: 1,
          },
        },
        present: 1,
        total: 1,
        percentage: {
          $multiply: [{ $divide: ['$present', '$total'] }, 100],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  res.json(trends);
});

// @desc    Get marks distribution per subject
// @route   GET /api/analytics/marks-distribution
const getMarksDistribution = asyncHandler(async (req, res) => {
  const { classId, subject, examType } = req.query;

  const match = {};
  if (classId) match.classId = mongoose.Types.ObjectId(classId);
  if (subject) match.subject = subject;
  if (examType) match.examType = examType;

  const distribution = await Marks.aggregate([
    { $match: match },
    {
      $bucket: {
        groupBy: {
          $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100],
        },
        boundaries: [0, 35, 50, 60, 70, 80, 90, 101],
        default: 'Other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  const labels = ['0-35', '35-50', '50-60', '60-70', '70-80', '80-90', '90-100'];
  const data = labels.map((label, index) => {
    const bucket = distribution.find(b => b._id >= (index === 0 ? 0 : parseInt(label.split('-')[0])));
    return bucket ? bucket.count : 0;
  });

  res.json({ labels, data });
});

// @desc    Get teacher performance comparison
// @route   GET /api/analytics/teacher-performance
const getTeacherPerformance = asyncHandler(async (req, res) => {
  const { subject, classId } = req.query;

  const match = {};
  if (subject) match.subject = subject;
  if (classId) match.classId = mongoose.Types.ObjectId(classId);

  const performance = await Marks.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'classes',
        localField: 'classId',
        foreignField: '_id',
        as: 'class',
      },
    },
    { $unwind: '$class' },
    {
      $lookup: {
        from: 'teachers',
        localField: 'class.teacherId',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher.userId',
        foreignField: '_id',
        as: 'teacherUser',
      },
    },
    { $unwind: { path: '$teacherUser', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$teacher._id',
        teacherName: { $first: '$teacherUser.name' },
        classAvg: {
          $avg: { $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100] },
        },
        totalStudents: { $sum: 1 },
      },
    },
    {
      $match: { _id: { $ne: null } },
    },
    {
      $project: {
        _id: 0,
        teacherId: '$_id',
        teacherName: 1,
        average: { $round: ['$classAvg', 1] },
        totalStudents: 1,
      },
    },
    { $sort: { average: -1 } },
  ]);

  res.json(performance);
});

// @desc    Get filter options (classes, subjects)
// @route   GET /api/analytics/filters
const getFilterOptions = asyncHandler(async (req, res) => {
  const classes = await Class.find({}).select('name').lean();
  const subjects = await Marks.distinct('subject');
  const examTypes = await Marks.distinct('examType');

  res.json({
    classes: classes.map(c => ({ value: c._id, label: c.name })),
    subjects: subjects.sort(),
    examTypes: examTypes.sort(),
  });
});

module.exports = {
  getAttendanceTrends,
  getMarksDistribution,
  getTeacherPerformance,
  getFilterOptions,
};