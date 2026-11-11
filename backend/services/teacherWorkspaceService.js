const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const TeacherAttendance = require('../models/TeacherAttendance');
const StaffLeaveRequest = require('../models/StaffLeaveRequest');
const StaffGatePass = require('../models/StaffGatePass');
const LessonPlan = require('../models/LessonPlan');
const LearningContinuityLog = require('../models/LearningContinuityLog');
const StudentIntervention = require('../models/StudentIntervention');
const PTMMeeting = require('../models/PTMMeeting');
const Substitution = require('../models/Substitution');
const InvigilationDuty = require('../models/InvigilationDuty');
const Exam = require('../models/Exam');
const ClassModel = require('../models/Class');
const learningContinuityService = require('./learningContinuityService');

const startOfMonth = (value = new Date()) => new Date(value.getFullYear(), value.getMonth(), 1);
const percent = (value, total) => (total ? Math.round((Number(value || 0) / Number(total || 1)) * 100) : 0);

const getTeacherProfile = async (userId) => {
  const teacher = await Teacher.findOne({ userId })
    .populate('userId', 'name email role')
    .populate('classes', 'name grade students');

  if (!teacher) {
    throw new Error('Teacher profile not found');
  }

  return teacher;
};

const getAttendanceSummary = async (teacher) => {
  const records = await TeacherAttendance.find({
    teacherId: teacher._id,
    date: { $gte: startOfMonth() },
  }).lean();

  const present = records.filter((item) => item.status === 'present').length;
  const late = records.filter((item) => item.status === 'late').length;
  const leave = records.filter((item) => item.status === 'leave').length;
  const absent = records.filter((item) => item.status === 'absent').length;

  return {
    total: records.length,
    present,
    late,
    leave,
    absent,
    percentage: percent(present, records.length),
  };
};

const getContinuitySummary = async (teacherId) => {
  const logs = await LearningContinuityLog.find({
    teacher: teacherId,
    date: { $gte: startOfMonth() },
  }).lean();

  return {
    totalLogs: logs.length,
    lessonsCompleted: logs.reduce((sum, item) => sum + Number(item.lessonsCompleted || 0), 0),
    resourcesShared: logs.reduce((sum, item) => sum + Number(item.resourcesShared || 0), 0),
    liveSessionsScheduled: logs.reduce((sum, item) => sum + Number(item.liveSessionsScheduled || 0), 0),
    continuityScoreAverage: logs.length
      ? Math.round(logs.reduce((sum, item) => sum + Number(item.continuityScore || 0), 0) / logs.length)
      : 0,
  };
};

exports.getOverview = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const [attendance, leaveRequests, gatePasses, interventions, ptms, substitutions, continuity] = await Promise.all([
    getAttendanceSummary(teacher),
    StaffLeaveRequest.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
    StaffGatePass.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
    StudentIntervention.find({ teacherId: teacher._id, status: { $ne: 'resolved' } }).sort({ createdAt: -1 }).limit(8).lean(),
    PTMMeeting.find({ teacherId: teacher._id }).sort({ scheduledAt: 1 }).limit(8).lean(),
    Substitution.find({
      $or: [{ absentTeacherId: teacher._id }, { substituteTeacherId: teacher._id }],
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }).sort({ date: 1 }).limit(8).lean(),
    getContinuitySummary(teacher._id),
  ]);

  return {
    teacher: {
      _id: teacher._id,
      name: teacher.userId?.name,
      email: teacher.userId?.email,
      classCount: teacher.classes?.length || 0,
      subjectCount: teacher.subjects?.length || 0,
    },
    summary: {
      attendanceRate: attendance.percentage,
      pendingLeaveRequests: leaveRequests.filter((item) => item.status === 'pending').length,
      pendingGatePasses: gatePasses.filter((item) => item.status === 'pending').length,
      openInterventions: interventions.length,
      scheduledPTMs: ptms.filter((item) => item.status === 'scheduled').length,
      activeSubstitutions: substitutions.length,
      continuityScoreAverage: continuity.continuityScoreAverage,
    },
    attendance,
    leaveRequests,
    gatePasses,
    interventions,
    ptms,
    substitutions,
    continuity,
  };
};

exports.getSelfServiceCenter = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const [attendance, leaveRequests, gatePasses] = await Promise.all([
    getAttendanceSummary(teacher),
    StaffLeaveRequest.find({ userId }).sort({ createdAt: -1 }).lean(),
    StaffGatePass.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    summary: {
      attendanceRate: attendance.percentage,
      pendingLeaveRequests: leaveRequests.filter((item) => item.status === 'pending').length,
      approvedLeaves: leaveRequests.filter((item) => item.status === 'approved').length,
      pendingGatePasses: gatePasses.filter((item) => item.status === 'pending').length,
    },
    attendance,
    leaveRequests,
    gatePasses,
  };
};

exports.createLeaveRequest = async (userId, payload) => {
  return StaffLeaveRequest.create({
    userId,
    leaveType: payload.leaveType || 'casual',
    fromDate: payload.fromDate,
    toDate: payload.toDate,
    reason: payload.reason || '',
  });
};

exports.createGatePass = async (userId, payload) => {
  return StaffGatePass.create({
    userId,
    issuedBy: userId,
    passType: payload.passType || 'official_duty',
    reason: payload.reason,
    exitTime: payload.exitTime,
    returnTime: payload.returnTime || null,
  });
};

exports.getLessonDeliveryTracker = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const [plans, logs] = await Promise.all([
    LessonPlan.find({ teacher: teacher._id })
      .populate('class', 'name')
      .populate('subject', 'name code')
      .sort({ date: -1, createdAt: -1 })
      .limit(20)
      .lean(),
    LearningContinuityLog.find({ teacher: teacher._id })
      .populate('class', 'name')
      .populate('subject', 'name code')
      .sort({ date: -1, createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    summary: {
      totalPlans: plans.length,
      completedPlans: plans.filter((item) => item.isCompleted).length,
      completionRate: percent(plans.filter((item) => item.isCompleted).length, plans.length),
      continuityLogs: logs.length,
    },
    plans,
    logs,
  };
};

exports.recordLessonDelivery = async (userId, payload) => {
  const teacher = await getTeacherProfile(userId);
  const plan = payload.lessonPlanId ? await LessonPlan.findById(payload.lessonPlanId) : null;

  const saved = await learningContinuityService.recordEvent({
    date: payload.date || new Date(),
    teacher: teacher._id,
    classId: payload.classId || plan?.class || null,
    subject: payload.subjectId || plan?.subject || null,
    source: 'manual',
    increments: {
      lessonsCompleted: Number(payload.lessonsCompleted || 1),
      resourcesShared: Number(payload.resourcesShared || 0),
      liveSessionsScheduled: Number(payload.liveSessionsScheduled || 0),
    },
    setFields: {
      deliveryMode: payload.deliveryMode || 'in_person',
      triggeredByWeather: Boolean(payload.triggeredByWeather),
    },
    notes: payload.notes || '',
    metadata: {
      lessonPlanId: payload.lessonPlanId || null,
    },
  });

  if (plan && !plan.isCompleted && payload.markPlanCompleted !== false) {
    plan.isCompleted = true;
    await plan.save();
  }

  return saved;
};

exports.getInterventions = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const items = await StudentIntervention.find({ teacherId: teacher._id })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return {
    summary: {
      total: items.length,
      open: items.filter((item) => item.status === 'open').length,
      monitoring: items.filter((item) => item.status === 'monitoring').length,
      resolved: items.filter((item) => item.status === 'resolved').length,
    },
    items,
  };
};

exports.createIntervention = async (userId, payload) => {
  const teacher = await getTeacherProfile(userId);
  return StudentIntervention.create({
    teacherId: teacher._id,
    studentId: payload.studentId,
    classId: payload.classId || null,
    category: payload.category || 'academic',
    priority: payload.priority || 'medium',
    concern: payload.concern,
    actionPlan: payload.actionPlan || '',
    followUpDate: payload.followUpDate || null,
    parentInformed: Boolean(payload.parentInformed),
    notes: payload.notes || '',
  });
};

exports.updateIntervention = async (userId, id, payload) => {
  const teacher = await getTeacherProfile(userId);
  const item = await StudentIntervention.findOne({ _id: id, teacherId: teacher._id });
  if (!item) {
    throw new Error('Intervention record not found');
  }

  Object.assign(item, {
    category: payload.category ?? item.category,
    priority: payload.priority ?? item.priority,
    status: payload.status ?? item.status,
    concern: payload.concern ?? item.concern,
    actionPlan: payload.actionPlan ?? item.actionPlan,
    followUpDate: payload.followUpDate ?? item.followUpDate,
    parentInformed: payload.parentInformed ?? item.parentInformed,
    notes: payload.notes ?? item.notes,
  });

  await item.save();
  return item;
};

exports.getPTMCenter = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const meetings = await PTMMeeting.find({ teacherId: teacher._id })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort({ scheduledAt: 1 })
    .lean();

  return {
    summary: {
      total: meetings.length,
      scheduled: meetings.filter((item) => item.status === 'scheduled').length,
      completed: meetings.filter((item) => item.status === 'completed').length,
      cancelled: meetings.filter((item) => item.status === 'cancelled').length,
    },
    meetings,
  };
};

exports.createPTMMeeting = async (userId, payload) => {
  const teacher = await getTeacherProfile(userId);
  return PTMMeeting.create({
    teacherId: teacher._id,
    studentId: payload.studentId,
    classId: payload.classId || null,
    topic: payload.topic,
    scheduledAt: payload.scheduledAt,
    mode: payload.mode || 'on_campus',
    parentName: payload.parentName || '',
    notes: payload.notes || '',
  });
};

exports.updatePTMMeeting = async (userId, id, payload) => {
  const teacher = await getTeacherProfile(userId);
  const item = await PTMMeeting.findOne({ _id: id, teacherId: teacher._id });
  if (!item) {
    throw new Error('PTM record not found');
  }

  Object.assign(item, {
    topic: payload.topic ?? item.topic,
    scheduledAt: payload.scheduledAt ?? item.scheduledAt,
    mode: payload.mode ?? item.mode,
    status: payload.status ?? item.status,
    parentName: payload.parentName ?? item.parentName,
    notes: payload.notes ?? item.notes,
    outcome: payload.outcome ?? item.outcome,
  });

  await item.save();
  return item;
};

exports.getSubstitutionInvigilationCenter = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const classIds = (teacher.classes || []).map((item) => item._id);

  const [substitutions, invigilationDuties, relevantExams] = await Promise.all([
    Substitution.find({
      $or: [{ absentTeacherId: teacher._id }, { substituteTeacherId: teacher._id }],
    })
      .populate('classId', 'name')
      .sort({ date: 1 })
      .lean(),
    InvigilationDuty.find({ teacherId: teacher._id })
      .populate('classId', 'name')
      .populate('examId', 'name date session')
      .sort({ dutyDate: 1 })
      .lean(),
    Exam.find({ classId: { $in: classIds }, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
      .populate('classId', 'name')
      .sort({ date: 1 })
      .limit(10)
      .lean(),
  ]);

  return {
    summary: {
      substitutions: substitutions.length,
      invigilationDuties: invigilationDuties.length,
      upcomingExams: relevantExams.length,
    },
    substitutions,
    invigilationDuties,
    relevantExams,
  };
};

exports.getLearningContinuityWorkspace = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const logs = await LearningContinuityLog.find({ teacher: teacher._id })
    .populate('class', 'name')
    .populate('subject', 'name code')
    .sort({ date: -1, createdAt: -1 })
    .limit(30)
    .lean();

  return {
    summary: {
      totalLogs: logs.length,
      remoteDays: logs.filter((item) => item.deliveryMode === 'remote').length,
      hybridDays: logs.filter((item) => item.deliveryMode === 'hybrid').length,
      weatherTriggeredDays: logs.filter((item) => item.triggeredByWeather).length,
      averageScore: logs.length
        ? Math.round(logs.reduce((sum, item) => sum + Number(item.continuityScore || 0), 0) / logs.length)
        : 0,
    },
    logs,
  };
};

exports.getTeacherContext = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  const classIds = (teacher.classes || []).map((item) => item._id);
  const [students, classes, user] = await Promise.all([
    Student.find({ classId: { $in: classIds } }).populate('userId', 'name').lean().catch(() => []),
    ClassModel.find({ _id: { $in: classIds } }).lean(),
    User.findById(userId).lean(),
  ]);

  return {
    teacher: {
      _id: teacher._id,
      name: teacher.userId?.name || user?.name || 'Teacher',
    },
    classes,
    students,
  };
};
