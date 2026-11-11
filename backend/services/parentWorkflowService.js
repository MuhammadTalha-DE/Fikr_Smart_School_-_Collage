const Parent = require('../models/Parent');
const HostelStudent = require('../models/HostelStudent');
const PTMMeeting = require('../models/PTMMeeting');
const StudentIntervention = require('../models/StudentIntervention');
const HealthIncident = require('../models/HealthIncident');
const StudentGatePass = require('../models/StudentGatePass');
const HostelVisitor = require('../models/HostelVisitor');
const workflowNoteService = require('./workflowNoteService');

const getParentProfile = async (userId) => {
  const parent = await Parent.findOne({ userId })
    .populate({
      path: 'children',
      populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }],
    });

  if (!parent) {
    throw new Error('Parent profile not found');
  }

  return parent;
};

const pickChildren = (parent, selectedChildId = '') => {
  const children = parent.children || [];
  if (!selectedChildId) return children;
  return children.filter((child) => String(child._id) === String(selectedChildId));
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

exports.getOverview = async (userId, selectedChildId = '') => {
  const parent = await getParentProfile(userId);
  const children = pickChildren(parent, selectedChildId);
  const childIds = children.map((child) => child._id);

  const [ptms, interventions, clinicAlerts, gatePasses] = await Promise.all([
    PTMMeeting.find({ studentId: { $in: childIds } }).lean(),
    StudentIntervention.find({ studentId: { $in: childIds }, status: { $ne: 'resolved' } }).lean(),
    HealthIncident.find({ studentId: { $in: childIds }, status: { $ne: 'resolved' } }).lean(),
    StudentGatePass.find({ studentId: { $in: childIds } }).lean(),
  ]);

  return {
    children: children.map((child) => ({
      _id: child._id,
      name: child.userId?.name || 'Child',
      className: child.classId?.name || 'Not assigned',
      admissionNumber: child.admissionNumber || '',
    })),
    selectedChildId: selectedChildId || childIds[0] || null,
    summary: {
      children: childIds.length,
      scheduledPTMs: ptms.filter((item) => item.status === 'scheduled').length,
      openInterventions: interventions.length,
      clinicAlerts: clinicAlerts.length,
      securityResponsesPending: gatePasses.filter((item) => item.parentResponseStatus === 'pending').length,
    },
  };
};

exports.getPTMCenter = async (userId, selectedChildId = '') => {
  const parent = await getParentProfile(userId);
  const children = pickChildren(parent, selectedChildId);
  const childIds = children.map((child) => child._id);

  const meetings = await PTMMeeting.find({ studentId: { $in: childIds } })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort({ scheduledAt: 1 })
    .lean();

  const items = await attachNotes('ptm_meeting', meetings);

  return {
    summary: {
      total: items.length,
      scheduled: items.filter((item) => item.status === 'scheduled').length,
      parentPending: items.filter((item) => item.parentResponseStatus === 'pending').length,
      confirmed: items.filter((item) => item.parentResponseStatus === 'confirmed').length,
    },
    items,
  };
};

exports.respondToPTMMeeting = async (userId, meetingId, payload) => {
  const parent = await getParentProfile(userId);
  const childIds = (parent.children || []).map((child) => String(child._id));
  const meeting = await PTMMeeting.findById(meetingId);

  if (!meeting || !childIds.includes(String(meeting.studentId))) {
    throw new Error('PTM meeting not found');
  }

  meeting.parentResponseStatus = payload.responseStatus || 'confirmed';
  meeting.parentResponseNote = payload.responseNote || '';
  meeting.parentRespondedAt = new Date();
  await meeting.save();

  if (payload.responseNote || payload.responseStatus) {
    await workflowNoteService.createNote({
      entityType: 'ptm_meeting',
      entityId: meeting._id,
      actorId: userId,
      actorRole: 'parent',
      actionType:
        payload.responseStatus === 'declined'
          ? 'decline'
          : payload.responseStatus === 'reschedule_requested'
            ? 'concern'
            : 'confirm',
      note: payload.responseNote || '',
      visibility: 'shared',
    });
  }

  return meeting;
};

exports.getInterventions = async (userId, selectedChildId = '') => {
  const parent = await getParentProfile(userId);
  const children = pickChildren(parent, selectedChildId);
  const childIds = children.map((child) => child._id);

  const interventions = await StudentIntervention.find({ studentId: { $in: childIds } })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const items = await attachNotes('student_intervention', interventions);

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

exports.getClinicAlerts = async (userId, selectedChildId = '') => {
  const parent = await getParentProfile(userId);
  const children = pickChildren(parent, selectedChildId);
  const childIds = children.map((child) => child._id);

  const incidents = await HealthIncident.find({ studentId: { $in: childIds } })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  const items = await attachNotes('health_incident', incidents);

  return {
    summary: {
      total: items.length,
      open: items.filter((item) => item.status === 'open').length,
      monitoring: items.filter((item) => item.status === 'monitoring').length,
      parentAlerted: items.filter((item) => item.parentAlerted).length,
    },
    items,
  };
};

exports.getSecurityCenter = async (userId, selectedChildId = '') => {
  const parent = await getParentProfile(userId);
  const children = pickChildren(parent, selectedChildId);
  const childIds = children.map((child) => child._id);
  const residents = await HostelStudent.find({ studentId: { $in: childIds }, status: 'active' }).lean();
  const residentIds = residents.map((item) => item._id);

  const [gatePasses, visitors] = await Promise.all([
    StudentGatePass.find({ studentId: { $in: childIds } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean(),
    HostelVisitor.find({ hostelStudentId: { $in: residentIds } })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const passItems = await attachNotes('student_gate_pass', gatePasses);
  const visitorItems = await attachNotes('hostel_visitor', visitors);

  return {
    summary: {
      gatePasses: passItems.length,
      pendingParentResponses: passItems.filter((item) => item.parentResponseStatus === 'pending').length,
      approvedPasses: passItems.filter((item) => item.status === 'approved').length,
      visitors: visitorItems.length,
    },
    gatePasses: passItems,
    visitors: visitorItems,
  };
};

exports.respondToGatePass = async (userId, gatePassId, payload) => {
  const parent = await getParentProfile(userId);
  const childIds = (parent.children || []).map((child) => String(child._id));
  const gatePass = await StudentGatePass.findById(gatePassId);

  if (!gatePass || !childIds.includes(String(gatePass.studentId))) {
    throw new Error('Gate pass not found');
  }

  gatePass.parentResponseStatus = payload.responseStatus || 'approved';
  gatePass.parentResponseNote = payload.responseNote || '';
  gatePass.parentRespondedAt = new Date();
  await gatePass.save();

  if (payload.responseNote || payload.responseStatus) {
    await workflowNoteService.createNote({
      entityType: 'student_gate_pass',
      entityId: gatePass._id,
      actorId: userId,
      actorRole: 'parent',
      actionType:
        payload.responseStatus === 'declined'
          ? 'decline'
          : payload.responseStatus === 'concern'
            ? 'concern'
            : 'confirm',
      note: payload.responseNote || '',
      visibility: 'shared',
    });
  }

  return gatePass;
};

exports.addWorkflowNote = async (userId, payload) => {
  const parent = await getParentProfile(userId);
  const childIds = (parent.children || []).map((child) => String(child._id));

  const allowedEntityResolvers = {
    student_intervention: async () => {
      const record = await StudentIntervention.findById(payload.entityId).select('studentId').lean();
      return record && childIds.includes(String(record.studentId));
    },
    health_incident: async () => {
      const record = await HealthIncident.findById(payload.entityId).select('studentId').lean();
      return record && childIds.includes(String(record.studentId));
    },
    ptm_meeting: async () => {
      const record = await PTMMeeting.findById(payload.entityId).select('studentId').lean();
      return record && childIds.includes(String(record.studentId));
    },
    student_gate_pass: async () => {
      const record = await StudentGatePass.findById(payload.entityId).select('studentId').lean();
      return record && childIds.includes(String(record.studentId));
    },
    hostel_visitor: async () => {
      const record = await HostelVisitor.findById(payload.entityId).select('hostelStudentId').lean();
      if (!record) return false;
      const resident = await HostelStudent.findById(record.hostelStudentId).select('studentId').lean();
      return resident && childIds.includes(String(resident.studentId));
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
    actorRole: 'parent',
    actionType: payload.actionType || 'note',
    note: payload.note || '',
    visibility: 'shared',
  });
};
