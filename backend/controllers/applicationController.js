const asyncHandler = require('express-async-handler');
const HostelApplication = require('../models/HostelApplication');
const HostelStudent = require('../models/HostelStudent');
const hostelFeeService = require('../services/hostelFeeService');
const HostelBed = require('../models/HostelBed');
const HostelRoom = require('../models/HostelRoom');
const auditService = require('../services/auditService');
const Student = require('../models/Student');
// Student applies
const applyHostel = asyncHandler(async (req, res) => {
  // 1. Find the student profile linked to this user
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('No student profile found for your account');
  }

  const studentId = student._id;

  // 2. Check if already applied (pending application)
  const existingApp = await HostelApplication.findOne({ studentId, status: 'pending' });
  if (existingApp) {
    res.status(400);
    throw new Error('You already have a pending application');
  }

  // 3. Check if already in a hostel
  const existingRecord = await HostelStudent.findOne({ studentId, status: 'active' });
  if (existingRecord) {
    res.status(400);
    throw new Error('You are already in a hostel');
  }

  // 4. Create the application
  const { reason } = req.body;
  const application = await HostelApplication.create({ studentId, reason });

  auditService.log({
    action: 'CREATE',
    entity: 'HostelApplication',
    entityId: application._id,
    description: `Hostel application submitted by student ${studentId}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(application);
});

// Get all applications (admin/warden)
// Get all applications (admin/warden)
const getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const applications = await HostelApplication.find(filter)
    .populate({
      path: 'studentId',
      select: 'userId admissionNumber classId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('approvedBy', 'name')
    .lean();
  res.json(applications);
});
// Approve application and allocate bed
const approveApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bedId } = req.body;

  const application = await HostelApplication.findById(id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (application.status !== 'pending') {
    res.status(400);
    throw new Error('Application already processed');
  }

  const bed = await HostelBed.findById(bedId);
  if (!bed || bed.status !== 'vacant') {
    res.status(400);
    throw new Error('Selected bed is not available');
  }

  bed.studentId = application.studentId;
  bed.status = 'occupied';
  await bed.save();

  await HostelRoom.findByIdAndUpdate(
    bed.roomId,
    { $inc: { occupiedBeds: 1 } }
  );

  const hostel = await HostelRoom.findById(bed.roomId).select('hostelId');

  await HostelStudent.create({
    studentId: application.studentId,
    hostelId: hostel.hostelId,
    roomId: bed.roomId,
    bedId: bed._id,
  });

  try {
    await hostelFeeService.createHostelFeeAccount(
      application.studentId,
      hostel.hostelId,
      req
    );
  } catch (feeError) {
    console.error('Hostel fee account creation failed:', feeError.message);
  }

  application.status = 'approved';
  application.approvedBy = req.user._id;
  await application.save();

  auditService.log({
    action: 'APPROVE',
    entity: 'HostelApplication',
    entityId: application._id,
    description: `Hostel application approved for student ${application.studentId}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: 'pending' }, after: { status: 'approved' } },
    req,
  });

  res.json({ message: 'Application approved successfully' });
});

// Reject application
const rejectApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const application = await HostelApplication.findByIdAndUpdate(
    id,
    { status: 'rejected', rejectionReason, approvedBy: req.user._id },
    { new: true }
  );

  auditService.log({
    action: 'REJECT',
    entity: 'HostelApplication',
    entityId: application._id,
    description: `Hostel application rejected`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Application rejected' });
});

module.exports = { applyHostel, getApplications, approveApplication, rejectApplication };