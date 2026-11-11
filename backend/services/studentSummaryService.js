const StudentAcademicSummary = require('../models/StudentAcademicSummary');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const BehaviourLog = require('../models/BehaviourLog');
const MeritSummary = require('../models/MeritSummary');
const CourseCoverage = require('../models/CourseCoverage');
const Student = require('../models/Student');

async function refreshStudentSummary(studentId) {
  // 1. Attendance
  const attendanceAgg = await Attendance.aggregate([
    { $match: { student: studentId } },
    { $group: { _id: null, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, total: { $sum: 1 } } }
  ]);
  const overall_attendance = attendanceAgg.length > 0
    ? Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 100)
    : 0;

  // 2. Marks – average across recent exams
  const marks = await Marks.find({ studentId: studentId }).lean();
  let average_marks = 0;
  let failed_subjects = 0;
  if (marks.length > 0) {
    const totalPercent = marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0);
    average_marks = Math.round(totalPercent / marks.length);
    failed_subjects = marks.filter(m => (m.marksObtained / m.totalMarks) < 0.4).length;
  }

  // 3. Behaviour points
  const merit = await MeritSummary.findOne({ student: studentId }).lean();
  const behaviour_points = merit ? merit.totalPoints : 0;

  // 4. Recent negative logs (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent_negative_logs = await BehaviourLog.countDocuments({
    student: studentId,
    type: 'negative',
    date: { $gte: thirtyDaysAgo },
  });

  // 5. Course coverage (average across enrolled subjects)
  const coverageDocs = await CourseCoverage.find({ student: studentId }).lean();
  let course_coverage_percent = 0;
  if (coverageDocs.length > 0) {
    const totalCoverage = coverageDocs.reduce((sum, c) => sum + (c.coveragePercentage || 0), 0);
    course_coverage_percent = Math.round(totalCoverage / coverageDocs.length);
  }

  await StudentAcademicSummary.findOneAndUpdate(
    { student: studentId },
    {
      overall_attendance,
      average_marks,
      failed_subjects,
      behaviour_points,
      recent_negative_logs,
      course_coverage_percent,
      last_updated: new Date(),
    },
    { upsert: true, new: true }
  );

  return await StudentAcademicSummary.findOne({ student: studentId }).lean();
}

module.exports = { refreshStudentSummary };
