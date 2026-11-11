const asyncHandler = require('express-async-handler');
const HostelVisitor = require('../models/HostelVisitor');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const auditService = require('../services/auditService');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const notificationAutomationService = require('../services/notificationAutomationService');

// @desc    Student requests a visitor
// @route   POST /api/hostel-visitors

// Helper
const getVerifiedStudentId = async (userId, requestedStudentId) => {
  const parent = await Parent.findOne({ userId }).lean();
  if (!parent) return null;
  const children = parent.children.map(c => c.toString());
  return children.includes(requestedStudentId) ? requestedStudentId : null;
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

const assertVisitorAccess = async (visitor, req) => {
  if (req.user.role === 'admin') return;

  const resident = await HostelStudent.findById(visitor.hostelStudentId).select('hostelId').lean();
  const hostel = resident ? await Hostel.findOne({ _id: resident.hostelId, wardenId: req.user._id }).select('_id').lean() : null;
  if (!hostel) {
    const error = new Error('This visitor request is not assigned to your hostel');
    error.statusCode = 403;
    throw error;
  }
};

const notifyVisitorAudience = async (visitor, req, title, message, status, channels = ['in_app', 'email']) => {
  const hostelStudent = await HostelStudent.findById(visitor.hostelStudentId).select('studentId').lean();
  const audienceUserIds = await notificationAutomationService.getAudienceForStudents(
    hostelStudent?.studentId ? [hostelStudent.studentId] : [],
    { includeStudents: true, includeParents: true }
  );

  notificationAutomationService.dispatch({
    title,
    message,
    type: 'hostel',
    severity: status === 'approved' || status === 'checked_in' || status === 'checked_out' ? 'info' : 'medium',
    channels,
    userIds: audienceUserIds,
    roles: ['admin', 'warden'],
    metadata: {
      entity: 'HostelVisitor',
      entityId: visitor._id,
      link: '/notifications',
      context: { status },
    },
    sourceModule: 'hostel',
  }, req.user, req).catch((error) => {
    console.error(`Hostel visitor ${status} notification failed:`, error.message);
  });
};

const requestVisitor = asyncHandler(async (req, res) => {
  // Find the Student record linked to the logged‑in user
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const hostelStudent = await HostelStudent.findOne({ studentId: student._id, status: 'active' });
  if (!hostelStudent) {
    res.status(403);
    throw new Error('You are not an active hostel resident');
  }

  const { visitorName, relation, purpose } = req.body;
  if (!visitorName || !visitorName.trim()) {
    res.status(400);
    throw new Error('Visitor name is required');
  }

  const visitor = await HostelVisitor.create({
    hostelStudentId: hostelStudent._id,
    visitorName: visitorName.trim(),
    relation: relation?.trim() || '',
    purpose: purpose?.trim() || ''
  });

  auditService.log({
    action: 'CREATE',
    entity: 'HostelVisitor',
    entityId: visitor._id,
    description: `Visitor request: ${visitorName}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  notificationAutomationService.dispatch({
    title: 'New hostel visitor request',
    message: `${req.user.name} requested visitor access for ${visitorName}.`,
    type: 'hostel',
    severity: 'medium',
    channels: ['in_app', 'email'],
    roles: ['warden', 'admin'],
    metadata: {
      entity: 'HostelVisitor',
      entityId: visitor._id,
      link: '/warden/visitors',
      context: { visitorName, relation, purpose },
    },
    sourceModule: 'hostel',
  }, req.user, req).catch((error) => {
    console.error('Hostel visitor request notification failed:', error.message);
  });

  res.status(201).json(visitor);
});

// @desc    Get visitor records (warden/admin sees all, student sees own)
// @route   GET /api/hostel-visitors
const getVisitors = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.json([]);

    const hostelStudent = await HostelStudent.findOne({ studentId: student._id, status: 'active' });
    if (!hostelStudent) return res.json([]);
    filter.hostelStudentId = hostelStudent._id;
  } else if (req.user.role === 'parent') {
    const childId = req.query.studentId;
    if (!childId) {
      res.status(400);
      throw new Error('studentId query parameter required');
    }

    const studentId = await getVerifiedStudentId(req.user._id, childId);
    if (!studentId) {
      res.status(403);
      throw new Error('Access denied');
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

  const visitors = await HostelVisitor.find(filter)
    .populate({
      path: 'hostelStudentId',
      populate: { path: 'studentId', select: 'userId classId', populate: { path: 'userId', select: 'name' } }
    })
    .sort('-createdAt')
    .lean();

  res.json(visitors);
});


// @desc    Approve a visitor request
// @route   PUT /api/hostel-visitors/:id/approve
const approveVisitor = asyncHandler(async (req, res) => {
  const visitor = await HostelVisitor.findById(req.params.id);
  if (!visitor || visitor.status !== 'pending') {
    res.status(400);
    throw new Error('Visitor request invalid or already processed');
  }
  await assertVisitorAccess(visitor, req);
  visitor.status = 'approved';
  visitor.approvedBy = req.user._id;
  await visitor.save();

  auditService.log({
    action: 'APPROVE',
    entity: 'HostelVisitor',
    entityId: visitor._id,
    description: `Visitor approved: ${visitor.visitorName}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: 'pending' }, after: { status: 'approved' } },
    req
  });

  await notifyVisitorAudience(visitor, req, 'Visitor request approved', `${visitor.visitorName} has been approved to visit the hostel.`, 'approved');

  res.json({ message: 'Visitor approved' });
});

// @desc    Check in visitor (warden)
// @route   PUT /api/hostel-visitors/:id/checkin
const checkInVisitor = asyncHandler(async (req, res) => {
  const visitor = await HostelVisitor.findById(req.params.id);
  if (!visitor || visitor.status !== 'approved') {
    res.status(400);
    throw new Error('Visitor must be approved first');
  }
  await assertVisitorAccess(visitor, req);
  visitor.status = 'checked_in';
  visitor.checkIn = new Date();
  await visitor.save();

  auditService.log({
    action: 'UPDATE',
    entity: 'HostelVisitor',
    entityId: visitor._id,
    description: `Visitor checked in: ${visitor.visitorName}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req
  });

  await notifyVisitorAudience(visitor, req, 'Visitor checked in', `${visitor.visitorName} has checked in at the hostel.`, 'checked_in', ['in_app']);

  res.json({ message: 'Visitor checked in' });
});

// @desc    Check out visitor
// @route   PUT /api/hostel-visitors/:id/checkout
const checkOutVisitor = asyncHandler(async (req, res) => {
  const visitor = await HostelVisitor.findById(req.params.id);
  if (!visitor || visitor.status !== 'checked_in') {
    res.status(400);
    throw new Error('Visitor must be checked in first');
  }
  await assertVisitorAccess(visitor, req);
  visitor.status = 'checked_out';
  visitor.checkOut = new Date();
  await visitor.save();

  auditService.log({
    action: 'UPDATE',
    entity: 'HostelVisitor',
    entityId: visitor._id,
    description: `Visitor checked out: ${visitor.visitorName}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req
  });

  await notifyVisitorAudience(visitor, req, 'Visitor checked out', `${visitor.visitorName} has checked out from the hostel.`, 'checked_out', ['in_app']);

  res.json({ message: 'Visitor checked out' });
});

// @desc    Reject a visitor request
// @route   PUT /api/hostel-visitors/:id/reject
const rejectVisitor = asyncHandler(async (req, res) => {
  const visitor = await HostelVisitor.findById(req.params.id);
  if (!visitor || visitor.status !== 'pending') {
    res.status(400);
    throw new Error('Visitor request invalid or already processed');
  }
  await assertVisitorAccess(visitor, req);
  visitor.status = 'rejected';
  visitor.approvedBy = req.user._id;
  await visitor.save();

  auditService.log({
    action: 'REJECT',
    entity: 'HostelVisitor',
    entityId: visitor._id,
    description: `Visitor rejected: ${visitor.visitorName}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: 'pending' }, after: { status: 'rejected' } },
    req
  });

  await notifyVisitorAudience(visitor, req, 'Visitor request rejected', `${visitor.visitorName} could not be approved for a hostel visit.`, 'rejected');

  res.json({ message: 'Visitor rejected' });
});

module.exports = { requestVisitor, getVisitors, approveVisitor, checkInVisitor, checkOutVisitor, rejectVisitor };
