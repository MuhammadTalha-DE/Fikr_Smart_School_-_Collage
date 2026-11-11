const asyncHandler = require('express-async-handler');
const HostelLeave = require('../models/HostelLeave');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const auditService = require('../services/auditService');
const Parent = require('../models/Parent');
const notificationAutomationService = require('../services/notificationAutomationService');
// @desc    Student applies for leave
// @route   POST /api/hostel-leaves

const getVerifiedStudentId = async (userId, requestedStudentId) => {
  const parent = await Parent.findOne({ userId }).lean();
  if (!parent) return null;
  const children = parent.children.map(c => c.toString());
  return children.includes(requestedStudentId) ? requestedStudentId : null;
};

const getStudentIdForUser = async (user) => {
  if (user.studentId) {
    return user.studentId;
  }
  const student = await Student.findOne({ userId: user._id }).select('_id').lean();
  return student?._id || null;
};

const getWardenResidentIds = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).select('_id').lean();
  if (!hostel) {
    const error = new Error('You are not assigned to a hostel');
    error.statusCode = 403;
    throw error;
  }

  const residents = await HostelStudent.find({ hostelId: hostel._id, status: 'active' }).select('_id').lean();
  return residents.map((resident) => resident._id);
};

const assertLeaveAccess = async (leave, req) => {
  if (req.user.role === 'admin') return;

  const resident = await HostelStudent.findById(leave.hostelStudentId).select('hostelId').lean();
  const hostel = resident ? await Hostel.findOne({ _id: resident.hostelId, wardenId: req.user._id }).select('_id').lean() : null;
  if (!hostel) {
    const error = new Error('This leave request is not assigned to your hostel');
    error.statusCode = 403;
    throw error;
  }
};

const applyLeave = asyncHandler(async (req, res) => {
  const studentId = await getStudentIdForUser(req.user);
  // Find the active hostel record for this student
  const hostelStudent = await HostelStudent.findOne({
    studentId,
    status: 'active'
  });
  if (!hostelStudent) {
    res.status(403);
    throw new Error('You are not an active hostel resident');
  }

  const { leaveType, fromDate, toDate, reason } = req.body;
  if (new Date(fromDate) > new Date(toDate)) {
    res.status(400);
    throw new Error('From date must be before to date');
  }

  const leave = await HostelLeave.create({
    hostelStudentId: hostelStudent._id,
    leaveType,
    fromDate,
    toDate,
    reason
  });

  auditService.log({
    action: 'CREATE',
    entity: 'HostelLeave',
    entityId: leave._id,
    description: `Leave application submitted (${leaveType}) from ${fromDate} to ${toDate}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req
  });

  notificationAutomationService.dispatch({
    title: 'New hostel leave request',
    message: `${req.user.name} submitted a ${leaveType} leave request from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}.`,
    type: 'hostel',
    severity: 'medium',
    channels: ['in_app', 'email'],
    roles: ['warden', 'admin'],
    metadata: {
      entity: 'HostelLeave',
      entityId: leave._id,
      link: '/warden/leaves',
      context: { leaveType },
    },
    sourceModule: 'hostel',
  }, req.user, req).catch((error) => {
    console.error('Hostel leave notification dispatch failed:', error.message);
  });

  res.status(201).json(leave);
});

// @desc    Get leaves (warden/admin sees all, student sees own)
// @route   GET /api/hostel-leaves
const getLeaves = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'student') {
    const studentId = await getStudentIdForUser(req.user);
    const hostelStudent = await HostelStudent.findOne({ studentId, status: 'active' });
    if (!hostelStudent) return res.json([]);
    filter.hostelStudentId = hostelStudent._id;
  } else if (req.user.role === 'parent') {
    const childId = req.query.studentId;
    if (!childId) throw new Error('studentId query parameter required');
    const studentId = await getVerifiedStudentId(req.user._id, childId);
    if (!studentId) {
      res.status(403);
      throw new Error('Access denied or invalid child');
    }
    const hostelStudent = await HostelStudent.findOne({ studentId, status: 'active' });
    if (!hostelStudent) return res.json([]);
    filter.hostelStudentId = hostelStudent._id;
  } else if (req.user.role === 'warden') {
    const residentIds = await getWardenResidentIds(req.user._id);
    if (req.query.hostelStudentId) {
      filter.hostelStudentId = residentIds.some((id) => String(id) === String(req.query.hostelStudentId))
        ? req.query.hostelStudentId
        : null;
    } else {
      filter.hostelStudentId = { $in: residentIds };
    }
  } else if (req.user.role === 'admin') {
    if (req.query.hostelStudentId) filter.hostelStudentId = req.query.hostelStudentId;
    if (req.query.studentId) {
      const hostelStudent = await HostelStudent.findOne({ studentId: req.query.studentId, status: 'active' }).select('_id').lean();
      filter.hostelStudentId = hostelStudent?._id || null;
    }
    if (req.query.hostelId) {
      const residents = await HostelStudent.find({ hostelId: req.query.hostelId, status: 'active' }).select('_id').lean();
      filter.hostelStudentId = { $in: residents.map((resident) => resident._id) };
    }
  }

  if (req.query.status) filter.status = req.query.status;

  const leaves = await HostelLeave.find(filter)
    .populate({
      path: 'hostelStudentId',
      populate: { path: 'studentId', select: 'userId classId admissionNumber', populate: { path: 'userId', select: 'name' } }
    })
    .sort('-createdAt')
    .lean();

  res.json(leaves);
});

// @desc    Approve a leave (warden/admin)
// @route   PUT /api/hostel-leaves/:id/approve
const approveLeave = asyncHandler(async (req, res) => {
  const leave = await HostelLeave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave not found');
  }
  if (leave.status !== 'pending') {
    res.status(400);
    throw new Error('Leave already processed');
  }
  await assertLeaveAccess(leave, req);
  leave.status = 'approved';
  leave.approvedBy = req.user._id;
  await leave.save();

  auditService.log({
    action: 'APPROVE',
    entity: 'HostelLeave',
    entityId: leave._id,
    description: `Leave approved`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: 'pending' }, after: { status: 'approved' } },
    req
  });

  const hostelStudent = await HostelStudent.findById(leave.hostelStudentId).select('studentId').lean();
  const audienceUserIds = await notificationAutomationService.getAudienceForStudents(
    hostelStudent?.studentId ? [hostelStudent.studentId] : [],
    { includeStudents: true, includeParents: true }
  );

  notificationAutomationService.dispatch({
    title: 'Hostel leave approved',
    message: 'Your hostel leave request has been approved.',
    type: 'hostel',
    severity: 'info',
    channels: ['in_app', 'email'],
    userIds: audienceUserIds,
    roles: ['admin', 'warden'],
    metadata: {
      entity: 'HostelLeave',
      entityId: leave._id,
      link: '/notifications',
      context: { status: 'approved' },
    },
    sourceModule: 'hostel',
  }, req.user, req).catch((error) => {
    console.error('Hostel leave approval notification failed:', error.message);
  });

  res.json({ message: 'Leave approved' });
});

// @desc    Reject a leave
// @route   PUT /api/hostel-leaves/:id/reject
const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await HostelLeave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave not found');
  }
  if (leave.status !== 'pending') {
    res.status(400);
    throw new Error('Leave already processed');
  }
  await assertLeaveAccess(leave, req);
  leave.status = 'rejected';
  leave.rejectionReason = req.body.rejectionReason || '';
  leave.approvedBy = req.user._id;
  await leave.save();

  auditService.log({
    action: 'REJECT',
    entity: 'HostelLeave',
    entityId: leave._id,
    description: `Leave rejected`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: 'pending' }, after: { status: 'rejected' } },
    req
  });

  const hostelStudent = await HostelStudent.findById(leave.hostelStudentId).select('studentId').lean();
  const audienceUserIds = await notificationAutomationService.getAudienceForStudents(
    hostelStudent?.studentId ? [hostelStudent.studentId] : [],
    { includeStudents: true, includeParents: true }
  );

  notificationAutomationService.dispatch({
    title: 'Hostel leave rejected',
    message: `Your hostel leave request has been rejected${leave.rejectionReason ? `: ${leave.rejectionReason}` : '.'}`,
    type: 'hostel',
    severity: 'medium',
    channels: ['in_app', 'email'],
    userIds: audienceUserIds,
    roles: ['admin', 'warden'],
    metadata: {
      entity: 'HostelLeave',
      entityId: leave._id,
      link: '/notifications',
      context: { status: 'rejected', rejectionReason: leave.rejectionReason },
    },
    sourceModule: 'hostel',
  }, req.user, req).catch((error) => {
    console.error('Hostel leave rejection notification failed:', error.message);
  });

  res.json({ message: 'Leave rejected' });
});

module.exports = { applyLeave, getLeaves, approveLeave, rejectLeave };
