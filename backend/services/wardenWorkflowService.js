const Hostel = require('../models/Hostel');
const HostelStudent = require('../models/HostelStudent');
const PTMMeeting = require('../models/PTMMeeting');
const StudentIntervention = require('../models/StudentIntervention');
const HealthIncident = require('../models/HealthIncident');
const StudentGatePass = require('../models/StudentGatePass');
const HostelVisitor = require('../models/HostelVisitor');
const workflowNoteService = require('./workflowNoteService');

const getWardenHostel = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).lean();
  if (!hostel) {
    throw new Error('You are not assigned to a hostel');
  }
  return hostel;
};

const getResidentData = async (userId) => {
  const hostel = await getWardenHostel(userId);
  const residents = await HostelStudent.find({ hostelId: hostel._id, status: 'active' })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .lean();

  return {
    hostel,
    residents,
    residentIds: residents.map((item) => item._id),
    studentIds: residents.map((item) => item.studentId?._id || item.studentId),
  };
};

const attachNotes = async (entityType, items) => {
  const notesMap = await workflowNoteService.getNotesForItems(
    items.map((item) => ({ entityType, entityId: item._id }))
  );

  return items.map((item) => ({
    ...item,
    noteCount: (notesMap.get(`${entityType}:${item._id}`) || []).length,
    latestNote: (notesMap.get(`${entityType}:${item._id}`) || [])[0] || null,
  }));
};

exports.getOverview = async (userId) => {
  const residentData = await getResidentData(userId);

  const [ptms, interventions, incidents, passes, visitors] = await Promise.all([
    PTMMeeting.find({ studentId: { $in: residentData.studentIds } }).lean(),
    StudentIntervention.find({ studentId: { $in: residentData.studentIds }, status: { $ne: 'resolved' } }).lean(),
    HealthIncident.find({ studentId: { $in: residentData.studentIds }, status: { $ne: 'resolved' } }).lean(),
    StudentGatePass.find({ studentId: { $in: residentData.studentIds } }).lean(),
    HostelVisitor.find({ hostelStudentId: { $in: residentData.residentIds } }).lean(),
  ]);

  return {
    hostel: residentData.hostel,
    summary: {
      residents: residentData.studentIds.length,
      scheduledPTMs: ptms.filter((item) => item.status === 'scheduled').length,
      openInterventions: interventions.length,
      openClinicAlerts: incidents.length,
      securityQueue: passes.filter((item) => item.status === 'pending').length + visitors.filter((item) => item.status === 'pending').length,
    },
  };
};

exports.getPTMCenter = async (userId) => {
  const residentData = await getResidentData(userId);
  const meetings = await PTMMeeting.find({ studentId: { $in: residentData.studentIds } })
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
    },
    items,
  };
};

exports.getInterventions = async (userId) => {
  const residentData = await getResidentData(userId);
  const interventions = await StudentIntervention.find({ studentId: { $in: residentData.studentIds } })
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
    },
    items,
  };
};

exports.getClinicAlerts = async (userId) => {
  const residentData = await getResidentData(userId);
  const incidents = await HealthIncident.find({ studentId: { $in: residentData.studentIds } })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  const items = await attachNotes('health_incident', incidents);

  return {
    summary: {
      total: items.length,
      open: items.filter((item) => item.status === 'open').length,
      monitoring: items.filter((item) => item.status === 'monitoring').length,
      critical: items.filter((item) => ['high', 'critical'].includes(item.severity)).length,
    },
    items,
  };
};

exports.getSecurityCenter = async (userId) => {
  const residentData = await getResidentData(userId);
  const [passes, visitors] = await Promise.all([
    StudentGatePass.find({ studentId: { $in: residentData.studentIds } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean(),
    HostelVisitor.find({ hostelStudentId: { $in: residentData.residentIds } })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const passItems = await attachNotes('student_gate_pass', passes);
  const visitorItems = await attachNotes('hostel_visitor', visitors);

  return {
    summary: {
      gatePasses: passItems.length,
      pendingPasses: passItems.filter((item) => item.status === 'pending').length,
      pendingParentResponses: passItems.filter((item) => item.parentResponseStatus === 'pending').length,
      visitors: visitorItems.length,
    },
    gatePasses: passItems,
    visitors: visitorItems,
  };
};

exports.addWorkflowNote = async (userId, payload) => {
  const residentData = await getResidentData(userId);
  const studentIds = residentData.studentIds.map((item) => String(item));
  const residentIds = residentData.residentIds.map((item) => String(item));

  const allowedEntityResolvers = {
    student_intervention: async () => {
      const record = await StudentIntervention.findById(payload.entityId).select('studentId').lean();
      return record && studentIds.includes(String(record.studentId));
    },
    health_incident: async () => {
      const record = await HealthIncident.findById(payload.entityId).select('studentId').lean();
      return record && studentIds.includes(String(record.studentId));
    },
    ptm_meeting: async () => {
      const record = await PTMMeeting.findById(payload.entityId).select('studentId').lean();
      return record && studentIds.includes(String(record.studentId));
    },
    student_gate_pass: async () => {
      const record = await StudentGatePass.findById(payload.entityId).select('studentId').lean();
      return record && studentIds.includes(String(record.studentId));
    },
    hostel_visitor: async () => {
      const record = await HostelVisitor.findById(payload.entityId).select('hostelStudentId').lean();
      return record && residentIds.includes(String(record.hostelStudentId));
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
    actorRole: 'warden',
    actionType: payload.actionType || 'note',
    note: payload.note || '',
    visibility: 'shared',
  });
};
