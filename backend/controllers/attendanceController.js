const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');
const attendanceAnalyticsService = require('../services/attendanceAnalyticsService');
const attendanceAlertService = require('../services/attendanceAlertService');
const realtimeService = require('../services/realtimeService');

// ============================================================
// MARK ATTENDANCE (Manual)
// ============================================================
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records, subjectId, method } = req.body;

  // If the user is a teacher, ensure they are the class teacher (or admin can skip)
  if (req.user.role === 'teacher') {
    const classData = await Class.findById(classId);
    if (!classData) {
      res.status(404);
      throw new Error('Class not found');
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || classData.teacherId?.toString() !== teacher._id.toString()) {
      res.status(403);
      throw new Error('Only the class teacher can mark attendance for this class');
    }
  }

  const teacher = await Teacher.findOne({ userId: req.user._id });

  const ops = records.map(rec => ({
    updateOne: {
      filter: { studentId: rec.studentId, classId, date },
      update: {
        $set: {
          ...rec,
          classId,
          date,
          subjectId: subjectId || null,
          teacherId: teacher?._id || null,
          markedBy: req.user._id,
          method: method || 'manual',
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);

  // Send absence alerts for absent students
  const classData = await Class.findById(classId);
  const absentStudents = records.filter(r => r.status === 'absent' || r.status === 'late');
  
  // Fire alerts asynchronously (don't block response)
  for (const rec of absentStudents) {
    attendanceAlertService.sendAbsenceAlert({
      studentId: rec.studentId,
      date,
      status: rec.status,
      className: classData?.name,
    });
  }

  realtimeService.emitAttendanceMarked({
    classId,
    date,
    count: records.length,
    method: method || 'manual',
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });

  res.json({ message: 'Attendance saved successfully', count: records.length });
});

// ============================================================
// GET ATTENDANCE
// ============================================================
const getAttendance = asyncHandler(async (req, res) => {
  const { classId, studentId, date, startDate, endDate, subjectId } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  
  if (date) {
    filter.date = new Date(date);
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(filter)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email rollNumber' },
    })
    .populate('subjectId', 'name code')
    .sort({ date: -1 });
  
  res.json(records);
});

// ============================================================
// GET ATTENDANCE STATS (Student)
// ============================================================
const getStudentAttendanceStats = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  // If student is viewing own attendance
  let targetStudentId = studentId;
  if (!targetStudentId && req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    targetStudentId = student?._id;
  }

  if (!targetStudentId) {
    res.status(400);
    throw new Error('Student ID is required');
  }

  const stats = await attendanceAnalyticsService.getStudentAttendanceStats(
    targetStudentId, startDate, endDate
  );

  res.json(stats);
});

// ============================================================
// GET TODAY'S STATS (Admin Dashboard)
// ============================================================
const getTodayStats = asyncHandler(async (req, res) => {
  const stats = await attendanceAnalyticsService.getTodayStats();
  res.json(stats);
});

// ============================================================
// GET LOW ATTENDANCE STUDENTS
// ============================================================
const getLowAttendanceStudents = asyncHandler(async (req, res) => {
  const { threshold, limit } = req.query;
  const students = await attendanceAnalyticsService.getLowAttendanceStudents(
    parseInt(threshold) || 75,
    parseInt(limit) || 20
  );
  res.json(students);
});

// ============================================================
// GET CLASS-WISE ATTENDANCE SUMMARY
// ============================================================
const getClassAttendanceSummary = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { startDate, endDate } = req.query;

  const summary = await attendanceAnalyticsService.getClassAttendanceSummary(
    classId, startDate, endDate
  );

  res.json(summary);
});

// ============================================================
// GET MONTHLY TRENDS
// ============================================================
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const { classId, year } = req.query;
  const trends = await attendanceAnalyticsService.getMonthlyTrends(
    classId,
    parseInt(year) || new Date().getFullYear()
  );
  res.json(trends);
});

// ============================================================
// GET ATTENDANCE RISK ANALYSIS
// ============================================================
const getAttendanceRiskAnalysis = asyncHandler(async (req, res) => {
  const riskAnalysis = await attendanceAnalyticsService.getAttendanceRiskAnalysis();
  res.json(riskAnalysis);
});

// ============================================================
// GENERATE RECOMMENDATIONS FROM ATTENDANCE
// ============================================================
const generateAttendanceRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await attendanceAnalyticsService.generateAttendanceRecommendations();
  res.json({ message: 'Recommendations generated', count: recommendations.length });
});

// ============================================================
// BULK IMPORT ATTENDANCE
// ============================================================
const bulkImportAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;

  if (!classId || !date || !records?.length) {
    res.status(400);
    throw new Error('Class ID, date, and records are required');
  }

  const ops = records.map(rec => ({
    updateOne: {
      filter: { studentId: rec.studentId, classId, date },
      update: {
        $set: {
          studentId: rec.studentId,
          classId,
          date,
          status: rec.status || 'present',
          markedBy: req.user._id,
          method: 'bulk',
          remarks: rec.remarks || '',
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);
  realtimeService.emitAttendanceMarked({
    classId,
    date,
    count: records.length,
    method: 'bulk',
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });

  res.json({
    message: 'Bulk import complete',
    matched: result.matchedCount,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  });
});

module.exports = {
  markAttendance,
  getAttendance,
  getStudentAttendanceStats,
  getTodayStats,
  getLowAttendanceStudents,
  getClassAttendanceSummary,
  getMonthlyTrends,
  getAttendanceRiskAnalysis,
  generateAttendanceRecommendations,
  bulkImportAttendance,
};
