const Attendance = require('../models/Attendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const HostelAttendance = require('../models/HostelAttendance');
const TransportAttendance = require('../models/TransportAttendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Recommendation = require('../models/Recommendation');

/**
 * Get attendance statistics for a student
 */
exports.getStudentAttendanceStats = async (studentId, startDate, endDate) => {
  const filter = { studentId };
  if (startDate) filter.date = { $gte: new Date(startDate) };
  if (endDate) {
    filter.date = { ...filter.date, $lte: new Date(endDate) };
  }

  const records = await Attendance.find(filter);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const leave = records.filter(r => ['leave', 'medical_leave'].includes(r.status)).length;

  return {
    total,
    present,
    absent,
    late,
    leave,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    records,
  };
};

/**
 * Get class-wise attendance summary
 */
exports.getClassAttendanceSummary = async (classId, startDate, endDate) => {
  const filter = { classId };
  if (startDate) filter.date = { $gte: new Date(startDate) };
  if (endDate) {
    filter.date = { ...filter.date, $lte: new Date(endDate) };
  }

  const records = await Attendance.find(filter).populate('studentId', 'userId');
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;

  return {
    classId,
    total,
    present,
    absent,
    late,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
  };
};

/**
 * Get today's attendance stats for admin dashboard
 */
exports.getTodayStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRecords = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
  });

  const total = todayRecords.length;
  const present = todayRecords.filter(r => r.status === 'present').length;
  const absent = todayRecords.filter(r => r.status === 'absent').length;
  const late = todayRecords.filter(r => r.status === 'late').length;
  const leave = todayRecords.filter(r => ['leave', 'medical_leave'].includes(r.status)).length;

  return {
    total,
    present,
    absent,
    late,
    leave,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    totalStudents: await Student.countDocuments(),
  };
};

/**
 * Identify students with low attendance (risk analysis)
 */
exports.getLowAttendanceStudents = async (threshold = 75, limit = 20) => {
  const students = await Student.find().populate('userId', 'name');
  const lowAttendanceStudents = [];

  for (const student of students) {
    const stats = await exports.getStudentAttendanceStats(student._id);
    if (stats.total > 0 && stats.percentage < threshold) {
      lowAttendanceStudents.push({
        _id: student._id,
        name: student.userId?.name || 'Unknown',
        percentage: stats.percentage,
        present: stats.present,
        total: stats.total,
        absent: stats.absent,
        late: stats.late,
      });
    }
  }

  return lowAttendanceStudents
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, limit);
};

/**
 * Get teacher attendance summary
 */
exports.getTeacherAttendanceStats = async (teacherId, startDate, endDate) => {
  const filter = { teacherId };
  if (startDate) filter.date = { $gte: new Date(startDate) };
  if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

  const records = await TeacherAttendance.find(filter);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;

  return {
    total,
    present,
    absent,
    late,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    records,
  };
};

/**
 * Generate attendance risk analysis for AI module
 */
exports.getAttendanceRiskAnalysis = async () => {
  const lowAttendanceStudents = await exports.getLowAttendanceStudents(75, 50);
  const riskAnalysis = [];

  for (const student of lowAttendanceStudents) {
    const riskLevel = student.percentage < 40 ? 'High' : student.percentage < 60 ? 'Medium' : 'Low';
    
    riskAnalysis.push({
      studentId: student._id,
      studentName: student.name,
      attendancePercentage: student.percentage,
      riskLevel,
      recommendations: exports.getRiskRecommendations(student.percentage),
    });
  }

  return riskAnalysis;
};

/**
 * Get recommendations based on attendance percentage
 */
exports.getRiskRecommendations = (percentage) => {
  if (percentage < 40) {
    return [
      'Urgent parent-teacher meeting required',
      'Student may need counseling',
      'Consider academic probation warning',
      'Daily attendance monitoring recommended',
    ];
  }
  if (percentage < 60) {
    return [
      'Parent meeting recommended',
      'Weekly attendance tracking',
      'Identify root cause of absence',
    ];
  }
  if (percentage < 75) {
    return [
      'Send attendance improvement notice',
      'Monitor for next 4 weeks',
      'Encourage regular attendance',
    ];
  }
  return ['Attendance is satisfactory, continue monitoring'];
};

/**
 * Get monthly attendance trends
 */
exports.getMonthlyTrends = async (classId, year) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const trends = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = new Date(year, i, 1);
    const endOfMonth = new Date(year, i + 1, 1);

    const filter = { date: { $gte: startOfMonth, $lt: endOfMonth } };
    if (classId) filter.classId = classId;

    const records = await Attendance.find(filter);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;

    trends.push({
      month: months[i],
      total,
      present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  }

  return trends;
};

/**
 * Generate attendance risk recommendations and save as Recommendations
 */
exports.generateAttendanceRecommendations = async () => {
  const riskAnalysis = await exports.getAttendanceRiskAnalysis();
  const recommendations = [];

  for (const item of riskAnalysis) {
    if (item.riskLevel === 'High' || item.riskLevel === 'Medium') {
      const student = await Student.findById(item.studentId).populate('userId');
      if (student?.userId) {
        const rec = await Recommendation.create({
          user: student.userId._id,
          role: 'student',
          type: 'attendance_warning',
          message: `Your attendance is ${item.attendancePercentage}% (${item.riskLevel} risk). ${item.recommendations[0]}`,
          priority: item.riskLevel === 'High' ? 'high' : 'medium',
          source: 'rule_engine',
          metadata: {
            attendancePercentage: item.attendancePercentage,
            riskLevel: item.riskLevel,
            studentId: item.studentId,
          },
        });
        recommendations.push(rec);
      }
    }
  }

  return recommendations;
};
