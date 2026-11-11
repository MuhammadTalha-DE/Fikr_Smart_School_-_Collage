const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const PTMMeeting = require('../models/PTMMeeting');
const StudentGatePass = require('../models/StudentGatePass');
const Notification = require('../models/Notification');
const workflowNoteService = require('./workflowNoteService');
const notificationAutomationService = require('./notificationAutomationService');

const getStudentProfile = async (userId) => {
  const student = await Student.findOne({ userId })
    .populate('userId', 'name')
    .populate('classId', 'name')
    .lean();

  if (!student) {
    throw new Error('Student profile not found');
  }

  return student;
};

const attachNotes = async (entityType, items) => {
  const notesMap = await workflowNoteService.getNotesForItems(
    items.map((item) => ({ entityType, entityId: item._id }))
  );

  return items.map((item) => {
    const notes = notesMap.get(`${entityType}:${item._id}`) || [];
    return {
      ...item,
      noteCount: notes.length,
      latestNote: notes[0] || null,
    };
  });
};

exports.getOverview = async (userId) => {
  const student = await getStudentProfile(userId);

  const [ptms, gatePasses, transportNotices] = await Promise.all([
    PTMMeeting.find({ studentId: student._id }).lean(),
    StudentGatePass.find({ studentId: student._id }).lean(),
    Notification.find({ sourceModule: 'transport', 'audience.userIds': userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    student: {
      _id: student._id,
      name: student.userId?.name || 'Student',
      className: student.classId?.name || 'Not assigned',
      admissionNumber: student.admissionNumber || '',
    },
    summary: {
      scheduledPTMs: ptms.filter((item) => item.status === 'scheduled').length,
      pendingParentResponses: ptms.filter((item) => item.parentResponseStatus === 'pending').length,
      gatePasses: gatePasses.length,
      gatePassParentPending: gatePasses.filter((item) => item.parentResponseStatus === 'pending').length,
      transportNotices: transportNotices.length,
    },
    recentTransportNotices: transportNotices.slice(0, 4),
  };
};

exports.getPTMCenter = async (userId) => {
  const student = await getStudentProfile(userId);
  const meetings = await PTMMeeting.find({ studentId: student._id })
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort({ scheduledAt: 1 })
    .lean();

  const items = await attachNotes('ptm_meeting', meetings);

  return {
    summary: {
      total: items.length,
      scheduled: items.filter((item) => item.status === 'scheduled').length,
      pendingParentResponses: items.filter((item) => item.parentResponseStatus === 'pending').length,
      acknowledged: items.filter((item) => item.studentAcknowledgedAt).length,
      remindersRequested: items.filter((item) => Number(item.studentReminderCount || 0) > 0).length,
    },
    items,
  };
};

exports.acknowledgePTMMeeting = async (userId, meetingId, payload = {}) => {
  const student = await getStudentProfile(userId);
  const meeting = await PTMMeeting.findOne({ _id: meetingId, studentId: student._id });

  if (!meeting) {
    throw new Error('PTM meeting not found');
  }

  meeting.studentAcknowledgedAt = new Date();
  await meeting.save();

  await workflowNoteService.createNote({
    entityType: 'ptm_meeting',
    entityId: meeting._id,
    actorId: userId,
    actorRole: 'student',
    actionType: 'acknowledge',
    note: payload.note || '',
    visibility: 'shared',
  });

  return meeting;
};

exports.requestPTMReminder = async (userId, meetingId, payload = {}) => {
  const student = await getStudentProfile(userId);
  const meeting = await PTMMeeting.findOne({ _id: meetingId, studentId: student._id });

  if (!meeting) {
    throw new Error('PTM meeting not found');
  }

  meeting.studentReminderRequestedAt = new Date();
  meeting.studentReminderCount = Number(meeting.studentReminderCount || 0) + 1;
  await meeting.save();

  const teacher = await Teacher.findById(meeting.teacherId).select('userId').lean();
  const parentAudience = await notificationAutomationService.getAudienceForStudents([student._id], {
    includeStudents: false,
    includeParents: true,
  });
  const audienceUserIds = [...new Set([...parentAudience, teacher?.userId].filter(Boolean).map((item) => String(item)))];

  if (audienceUserIds.length) {
    await notificationAutomationService.dispatch({
      title: `PTM reminder requested for ${student.userId?.name || 'student'}`,
      message: payload.note || `${student.userId?.name || 'The student'} requested a reminder for the scheduled PTM.`,
      type: 'academic',
      severity: 'medium',
      channels: ['in_app'],
      roles: ['parent', 'teacher'],
      userIds: audienceUserIds,
      metadata: {
        entity: 'PTMMeeting',
        entityId: meeting._id,
        link: '/notifications',
        context: {
          meetingId: String(meeting._id),
          studentId: String(student._id),
          scheduledAt: meeting.scheduledAt,
        },
      },
      sourceModule: 'student-workflow',
    }, { _id: userId, role: 'student' });
  }

  await workflowNoteService.createNote({
    entityType: 'ptm_meeting',
    entityId: meeting._id,
    actorId: userId,
    actorRole: 'student',
    actionType: 'reminder',
    note: payload.note || '',
    visibility: 'shared',
  });

  return meeting;
};

exports.getGatePassCenter = async (userId) => {
  const student = await getStudentProfile(userId);
  const passes = await StudentGatePass.find({ studentId: student._id })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  const items = await attachNotes('student_gate_pass', passes);

  return {
    summary: {
      total: items.length,
      pendingApproval: items.filter((item) => item.status === 'pending').length,
      parentPending: items.filter((item) => item.parentResponseStatus === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
    },
    items,
  };
};

exports.addWorkflowNote = async (userId, payload) => {
  const student = await getStudentProfile(userId);

  const allowedEntityResolvers = {
    ptm_meeting: async () => {
      const record = await PTMMeeting.findById(payload.entityId).select('studentId').lean();
      return record && String(record.studentId) === String(student._id);
    },
    student_gate_pass: async () => {
      const record = await StudentGatePass.findById(payload.entityId).select('studentId').lean();
      return record && String(record.studentId) === String(student._id);
    },
  };

  const resolver = allowedEntityResolvers[payload.entityType];
  if (!resolver || !(await resolver())) {
    throw new Error('Workflow item not found');
  }

  return workflowNoteService.createNote({
    entityType: payload.entityType,
    entityId: payload.entityId,
    actorId: userId,
    actorRole: 'student',
    actionType: payload.actionType || 'note',
    note: payload.note || '',
    visibility: 'shared',
  });
};
