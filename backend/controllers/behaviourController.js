const BehaviourLog = require('../models/BehaviourLog');
const BehaviourCategory = require('../models/BehaviourCategory');
const MeritSummary = require('../models/MeritSummary');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const StudentActivity = require('../models/StudentActivity');
const asyncHandler = require('express-async-handler');

// ─── TEACHER: Log a behaviour incident ───────────────────────
const logBehaviour = asyncHandler(async (req, res) => {
  const { studentId, classId, category, severity, description, date } = req.body;

  if (!studentId || !classId || !category) {
    res.status(400);
    throw new Error('studentId, classId, and category are required');
  }

  // Get teacher profile
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(403);
    throw new Error('Only teachers can log behaviour');
  }

  // Determine type and points from category config
  const catConfig = await BehaviourCategory.findOne({ name: category });
  if (!catConfig) {
    res.status(400);
    throw new Error('Invalid behaviour category');
  }

  const log = await BehaviourLog.create({
    student: studentId,
    teacher: teacher._id,
    class: classId,
    category,
    type: catConfig.type,
    severity: severity || catConfig.severity,
    points: catConfig.defaultPoints,
    description: description || '',
    date: date || new Date(),
    term: req.body.term || getCurrentTerm(),   // helper function
  });

  // Update merit summary
  await updateMeritSummary(studentId);

  res.status(201).json({ success: true, log });
});

// ─── TEACHER: Get behaviour logs with filters ─────────────────
const getLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.class = req.query.classId;
  if (req.query.studentId) filter.student = req.query.studentId;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.term) filter.term = req.query.term;

  const logs = await BehaviourLog.find(filter)
    .populate('student', 'userId rollNumber')
    .populate({ path: 'student', populate: { path: 'userId', select: 'name avatar' } })
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .sort({ date: -1 })
    .lean();

  res.json({ success: true, logs });
});

// ─── TEACHER/STUDENT: Get merit summary for a student ─────────
const getStudentSummary = asyncHandler(async (req, res) => {
  const summary = await MeritSummary.findOne({ student: req.params.studentId }).lean();
  if (!summary) {
    return res.json({ totalPoints: 0, behaviourPoints: 0, activityPoints: 0 });
  }
  res.json({ success: true, summary });
});

// ─── Get available behaviour categories ───────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const categories = await BehaviourCategory.find({ isActive: true }).lean();
  res.json({ success: true, categories });
});

// ─── STUDENT: My behaviour logs ───────────────────────────────
const getMyLogs = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.json([]);

  const logs = await BehaviourLog.find({ student: student._id })
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .sort({ date: -1 })
    .lean();

  res.json({ success: true, logs });
});

// ─── Helper: Update cached merit summary ──────────────────────
async function updateMeritSummary(studentId) {
  const logs = await BehaviourLog.find({ student: studentId });
  const totalPoints = logs.reduce((sum, log) => sum + (log.points || 0), 0);

  await MeritSummary.findOneAndUpdate(
    { student: studentId },
    {
      totalPoints,
      behaviourPoints: totalPoints,   // activity points added separately in Phase 3
      lastUpdated: new Date(),
      term: getCurrentTerm(),
    },
    { upsert: true, new: true }
  );
}

function getCurrentTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 1 && month <= 6) return `Second Term ${year}`;
  return `First Term ${year}`;
}
// ─── PARENT: Get child's behaviour logs ───────────────────────
const getChildLogs = asyncHandler(async (req, res) => {
  // Verify the parent has access to this child
  const parent = await require('../models/Parent').findOne({ userId: req.user._id });
  if (!parent) {
    res.status(403);
    throw new Error('Parent profile not found');
  }

  const childId = req.params.childId;
  const isChildLinked = parent.children.some(
    c => c.toString() === childId
  );
  if (!isChildLinked) {
    res.status(403);
    throw new Error('You do not have access to this child');
  }

  const logs = await BehaviourLog.find({ student: childId })
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .sort({ date: -1 })
    .lean();

  res.json({ success: true, logs });
});

// ─── PARENT: Get child's merit summary ────────────────────────
const getChildSummary = asyncHandler(async (req, res) => {
  const parent = await require('../models/Parent').findOne({ userId: req.user._id });
  if (!parent) {
    res.status(403);
    throw new Error('Parent profile not found');
  }

  const childId = req.params.childId;
  const isChildLinked = parent.children.some(
    c => c.toString() === childId
  );
  if (!isChildLinked) {
    res.status(403);
    throw new Error('You do not have access to this child');
  }

  const summary = await MeritSummary.findOne({ student: childId }).lean();
  if (!summary) {
    return res.json({ totalPoints: 0, behaviourPoints: 0, activityPoints: 0 });
  }

  res.json({ success: true, summary });
});

// ─── STUDENT: Get my own merit summary ────────────────────────
const getMySummary = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const summary = await MeritSummary.findOne({ student: student._id }).lean();
  if (!summary) {
    return res.json({ totalPoints: 0, behaviourPoints: 0, activityPoints: 0 });
  }

  res.json({ success: true, summary });
});

// ─── STUDENT: Get class behaviour stats (for comparison) ──────
const getClassBehaviourStats = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || !student.classId) {
    return res.json({ topStudents: [], classAverage: 0 });
  }

  // Get all students in the class
  const classmates = await Student.find({ classId: student.classId }).lean();
  const studentIds = classmates.map(s => s._id);

  // Get merit summaries for all classmates
  const summaries = await MeritSummary.find({
    student: { $in: studentIds },
  }).populate('student', 'userId rollNumber')
    .populate({ path: 'student', populate: { path: 'userId', select: 'name avatar' } })
    .sort({ totalPoints: -1 })
    .lean();

  const classAverage = summaries.length > 0
    ? (summaries.reduce((sum, s) => sum + s.totalPoints, 0) / summaries.length).toFixed(1)
    : 0;

  // Top 5 students
  const topStudents = summaries.slice(0, 5).map(s => ({
    studentId: s.student?._id,
    name: s.student?.userId?.name || 'Unknown',
    avatar: s.student?.userId?.avatar || null,
    rollNumber: s.student?.rollNumber || '—',
    points: s.totalPoints,
  }));

  res.json({ success: true, topStudents, classAverage: parseFloat(classAverage) });
});

const logActivity = asyncHandler(async (req, res) => {
  const { studentId, activityName, category, role, achievement, eventDate, points } = req.body;

  if (!studentId || !activityName || !category) {
    res.status(400);
    throw new Error('studentId, activityName, and category are required');
  }

  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(403);
    throw new Error('Only teachers can log activities');
  }

  const activity = await StudentActivity.create({
    student: studentId,
    activityName,
    category,
    role: role || 'participant',
    achievement: achievement || '',
    eventDate: eventDate || new Date(),
    term: req.body.term || getCurrentTerm(),
    points: points || getDefaultPoints(category, role),
    verifiedBy: teacher._id,
  });

  // Update merit summary with activity points
  await updateMeritSummaryWithActivity(studentId);

  res.status(201).json({ success: true, activity });
});

// GET /api/behaviour/activity/logs?studentId=&category=&term=
const getActivityLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.studentId) filter.student = req.query.studentId;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.term) filter.term = req.query.term;

  const activities = await StudentActivity.find(filter)
    .populate('student', 'userId rollNumber')
    .populate({ path: 'student', populate: { path: 'userId', select: 'name avatar' } })
    .populate('verifiedBy', 'userId')
    .populate({ path: 'verifiedBy', populate: { path: 'userId', select: 'name' } })
    .sort({ eventDate: -1 })
    .lean();

  res.json({ success: true, activities });
});

// GET /api/behaviour/activity/my
const getMyActivities = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.json([]);

  const activities = await StudentActivity.find({ student: student._id })
    .sort({ eventDate: -1 })
    .lean();

  res.json({ success: true, activities });
});

// DELETE /api/behaviour/activity/:id
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await StudentActivity.findByIdAndDelete(req.params.id);
  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  // Recalculate merit summary
  await updateMeritSummaryWithActivity(activity.student);
  res.json({ success: true, message: 'Activity deleted' });
});

// ─── Helper Functions ─────────────────────────────────────────

function getDefaultPoints(category, role) {
  const pointsMap = {
    sports: { participant: 5, winner: 15, organizer: 10, leader: 10 },
    cultural: { participant: 5, winner: 15, organizer: 10, leader: 10 },
    club: { participant: 3, winner: 5, organizer: 8, leader: 8 },
    community_service: { participant: 5, winner: 10, organizer: 10, leader: 10 },
    academic: { participant: 5, winner: 15, organizer: 10, leader: 10 },
    other: { participant: 3, winner: 5, organizer: 5, leader: 5 },
  };
  return (pointsMap[category] && pointsMap[category][role]) ? pointsMap[category][role] : 5;
}

async function updateMeritSummaryWithActivity(studentId) {
  const logs = await BehaviourLog.find({ student: studentId });
  const activities = await StudentActivity.find({ student: studentId });

  const behaviourPoints = logs.reduce((sum, log) => sum + (log.points || 0), 0);
  const activityPoints = activities.reduce((sum, act) => sum + (act.points || 0), 0);
  const totalPoints = behaviourPoints + activityPoints;

  await MeritSummary.findOneAndUpdate(
    { student: studentId },
    {
      totalPoints,
      behaviourPoints,
      activityPoints,
      lastUpdated: new Date(),
      term: getCurrentTerm(),
    },
    { upsert: true, new: true }
  );
}

function getCurrentTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 1 && month <= 6) return `Second Term ${year}`;
  return `First Term ${year}`;
}
// ─── THRESHOLD & ALERT SYSTEM ─────────────────────────────────

// GET /api/behaviour/thresholds
const getThresholds = asyncHandler(async (req, res) => {
  // Default thresholds – can be stored in a Config model later
  const thresholds = {
    excellent: 50,    // Certificate of Good Conduct
    good: 0,
    warning: -20,     // Parent notification
    serious: -50,     // Meeting with principal
    critical: -80,    // Suspension warning
  };
  res.json({ success: true, thresholds });
});

// GET /api/behaviour/alerts
const getAlerts = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return res.json([]);

  // Find students in teacher's classes who crossed thresholds
  const classes = teacher.classes || [];
  const students = await Student.find({ classId: { $in: classes } }).lean();
  const studentIds = students.map(s => s._id);

  const summaries = await MeritSummary.find({ student: { $in: studentIds } })
    .populate('student', 'userId rollNumber classId')
    .populate({ path: 'student', populate: [
      { path: 'userId', select: 'name avatar' },
      { path: 'classId', select: 'name' }
    ]})
    .lean();

  const thresholds = {
    excellent: 50,
    warning: -20,
    serious: -50,
    critical: -80,
  };

  const alerts = summaries
    .filter(s => s.totalPoints <= thresholds.serious)
    .map(s => ({
      studentId: s.student?._id,
      studentName: s.student?.userId?.name || 'Unknown',
      avatar: s.student?.userId?.avatar || null,
      className: s.student?.classId?.name || 'Unknown',
      rollNumber: s.student?.rollNumber || '—',
      totalPoints: s.totalPoints,
      level: s.totalPoints <= thresholds.critical ? 'critical' :
             s.totalPoints <= thresholds.serious ? 'serious' : 'warning',
    }))
    .sort((a, b) => a.totalPoints - b.totalPoints);

  res.json({ success: true, alerts });
});

// ─── CLASS BEHAVIOUR REPORT ───────────────────────────────────

// GET /api/behaviour/report/class/:classId
const getClassReport = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  
  // Get all students in class
  const students = await Student.find({ classId })
    .populate('userId', 'name avatar')
    .lean();

  // Get merit summaries
  const studentIds = students.map(s => s._id);
  const summaries = await MeritSummary.find({ student: { $in: studentIds } }).lean();
  const summaryMap = {};
  summaries.forEach(s => { summaryMap[s.student.toString()] = s; });

  // Get behaviour logs for the class
  const logs = await BehaviourLog.find({ class: classId })
    .populate('student', 'userId')
    .populate({ path: 'student', populate: { path: 'userId', select: 'name' } })
    .sort({ date: -1 })
    .lean();

  // Category distribution
  const categoryDistribution = {};
  logs.forEach(log => {
    const cat = log.category.replace(/_/g, ' ');
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  });

  // Monthly trend (last 6 months)
  const monthlyTrend = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = month.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyTrend[key] = { positive: 0, negative: 0 };
  }
  logs.forEach(log => {
    const date = new Date(log.date);
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (monthlyTrend[key]) {
      monthlyTrend[key][log.type]++;
    }
  });

  // Student report
  const studentReport = students.map(student => {
    const merit = summaryMap[student._id.toString()] || { totalPoints: 0 };
    const studentLogs = logs.filter(l => l.student?._id.toString() === student._id.toString());
    const positive = studentLogs.filter(l => l.type === 'positive').length;
    const negative = studentLogs.filter(l => l.type === 'negative').length;
    return {
      studentId: student._id,
      name: student.userId?.name || 'Unknown',
      avatar: student.userId?.avatar || null,
      rollNumber: student.rollNumber || '—',
      totalPoints: merit.totalPoints,
      positiveCount: positive,
      negativeCount: negative,
      status: merit.totalPoints >= 30 ? 'excellent' :
              merit.totalPoints >= 0 ? 'good' :
              merit.totalPoints >= -20 ? 'warning' : 'critical',
    };
  });

  res.json({
    success: true,
    report: {
      totalStudents: students.length,
      totalLogs: logs.length,
      positiveLogs: logs.filter(l => l.type === 'positive').length,
      negativeLogs: logs.filter(l => l.type === 'negative').length,
      categoryDistribution,
      monthlyTrend,
      studentReport: studentReport.sort((a, b) => b.totalPoints - a.totalPoints),
    },
  });
});

// ─── SCHOOL‑WIDE BEHAVIOUR STATS (Admin) ──────────────────────

// GET /api/behaviour/school-stats
const getSchoolStats = asyncHandler(async (req, res) => {
  const totalLogs = await BehaviourLog.countDocuments();
  const totalPositive = await BehaviourLog.countDocuments({ type: 'positive' });
  const totalNegative = await BehaviourLog.countDocuments({ type: 'negative' });
  const totalActivities = await StudentActivity.countDocuments();
  
  // Most common categories
  const topCategories = await BehaviourLog.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Teachers most active in logging
  const topTeachers = await BehaviourLog.aggregate([
    { $group: { _id: '$teacher', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'teachers', localField: '_id', foreignField: '_id', as: 'teacher' } },
    { $unwind: '$teacher' },
    { $lookup: { from: 'users', localField: 'teacher.userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: '$user.name', count: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalLogs,
      totalPositive,
      totalNegative,
      totalActivities,
      topCategories,
      topTeachers,
    },
  });
});



module.exports = {
  logBehaviour,
  getLogs,
  getStudentSummary,
  getCategories,
  getMyLogs,
    getChildLogs,           // new
  getChildSummary,        // new
  getMySummary,           // new
  getClassBehaviourStats,
    logActivity,
  getActivityLogs,
  getMyActivities,
  deleteActivity,
   getThresholds,
  getAlerts,
  getClassReport,
  getSchoolStats,
  // new
};