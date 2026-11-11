const asyncHandler = require('express-async-handler');
const HostelComplaint = require('../models/HostelComplaint');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const auditService = require('../services/auditService');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

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

const assertComplaintAccess = async (complaint, req) => {
  if (req.user.role === 'admin') return;

  const resident = await HostelStudent.findById(complaint.hostelStudentId).select('hostelId').lean();
  const hostel = resident ? await Hostel.findOne({ _id: resident.hostelId, wardenId: req.user._id }).select('_id').lean() : null;
  if (!hostel) {
    const error = new Error('This complaint is not assigned to your hostel');
    error.statusCode = 403;
    throw error;
  }
};

// @desc    Student creates a complaint
// @route   POST /api/hostel-complaints
// Helper
const getVerifiedStudentId = async (userId, requestedStudentId) => {
  const parent = await Parent.findOne({ userId }).lean();
  if (!parent) return null;
  const children = parent.children.map(c => c.toString());
  return children.includes(requestedStudentId) ? requestedStudentId : null;
};
const createComplaint = asyncHandler(async (req, res) => {
  const studentId = await getStudentIdForUser(req.user);
  const hostelStudent = await HostelStudent.findOne({
    studentId,
    status: 'active',
  });
  if (!hostelStudent) {
    res.status(403);
    throw new Error('You are not an active hostel resident');
  }

  const { category, description, priority } = req.body;
  if (!category || !description) {
    res.status(400);
    throw new Error('Category and description are required');
  }

  const complaint = await HostelComplaint.create({
    hostelStudentId: hostelStudent._id,
    category,
    description,
    priority: priority || 'medium',
  });

  auditService.log({
    action: 'CREATE',
    entity: 'HostelComplaint',
    entityId: complaint._id,
    description: `Complaint created by student (${category})`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(complaint);
});

// @desc    Get complaints (student sees own; warden/admin sees all)
// @route   GET /api/hostel-complaints
const getComplaints = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'student') {
    const studentId = await getStudentIdForUser(req.user);
    const hostelStudent = await HostelStudent.findOne({ studentId, status: 'active' });
    if (!hostelStudent) return res.json([]);
    filter.hostelStudentId = hostelStudent._id;
  } else if (req.user.role === 'parent') {
    const childId = req.query.studentId;
    if (!childId) throw new Error('studentId required');
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
  if (req.query.category) filter.category = req.query.category;

  const complaints = await HostelComplaint.find(filter)
    .populate({
      path: 'hostelStudentId',
      populate: { path: 'studentId', select: 'userId admissionNumber', populate: { path: 'userId', select: 'name' } }
    })
    .populate('resolvedBy', 'name')
    .sort('-createdAt')
    .lean();

  res.json(complaints);
});

// @desc    Warden/Admin updates complaint status
// @route   PUT /api/hostel-complaints/:id
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await HostelComplaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const { status, resolutionNote } = req.body;
  await assertComplaintAccess(complaint, req);
  const oldStatus = complaint.status;

  complaint.status = status || complaint.status;
  if (status === 'resolved') {
    complaint.resolvedBy = req.user._id;
    complaint.resolutionNote = resolutionNote || complaint.resolutionNote;
  }
  await complaint.save();

  auditService.log({
    action: 'UPDATE',
    entity: 'HostelComplaint',
    entityId: complaint._id,
    description: `Complaint status changed from ${oldStatus} to ${complaint.status}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: oldStatus }, after: { status: complaint.status } },
    req,
  });

  res.json(complaint);
});

module.exports = { createComplaint, getComplaints, updateComplaintStatus };
