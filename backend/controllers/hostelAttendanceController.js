const asyncHandler = require('express-async-handler');
const HostelAttendance = require('../models/HostelAttendance');
const Parent = require('../models/Parent'); 
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const auditService = require('../services/auditService');

// Helper: get the hostel assigned to the logged‑in warden
// Helper
const getVerifiedStudentId = async (userId, requestedStudentId) => {
  const parent = await Parent.findOne({ userId }).lean();
  if (!parent) return null;
  const children = parent.children.map(c => c.toString());
  return children.includes(requestedStudentId) ? requestedStudentId : null;
};
const getWardenHostel = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).lean();
  if (!hostel) {
    throw new Error('You are not assigned to any hostel');
  }
  return hostel;
};

// Helper: get all active residents of a hostel
const getActiveResidents = async (hostelId) => {
  return HostelStudent.find({ hostelId, status: 'active' })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .lean();
};

// @desc    Mark attendance for a hostel on a given date
// @route   POST /api/hostel-attendance
const markAttendance = asyncHandler(async (req, res) => {
  const hostel = await getWardenHostel(req.user._id);
  const { date, attendanceData } = req.body;
  // attendanceData: [{ hostelStudentId, status, remark }]

  if (!date || !attendanceData || !Array.isArray(attendanceData)) {
    res.status(400);
    throw new Error('Date and attendance data are required');
  }

  const existing = await HostelAttendance.findOne({ hostelId: hostel._id, date: new Date(date) });
  if (existing) {
    res.status(400);
    throw new Error('Attendance already marked for this date');
  }

  const attendance = await HostelAttendance.create({
    hostelId: hostel._id,
    date,
    records: attendanceData,
    markedBy: req.user._id,
  });

  auditService.log({
    action: 'CREATE',
    entity: 'HostelAttendance',
    entityId: attendance._id,
    description: `Hostel attendance marked for ${new Date(date).toLocaleDateString()}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(attendance);
});

// @decsc    Get attendance for a specific date (warden) or all dates for a hostel
// @route   GET /api/hostel-attendance?date=YYYY-MM-DD
const getAttendanceByDate = asyncHandler(async (req, res) => {
  let hostelId;
  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user._id);
    hostelId = hostel._id;
  } else if (req.query.hostelId && req.user.role === 'admin') {
    hostelId = req.query.hostelId;
  } else {
    res.status(403);
    throw new Error('Not authorized');
  }

  const filter = { hostelId };
  if (req.query.date) {
    filter.date = new Date(req.query.date);
  }

  const attendanceRecords = await HostelAttendance.find(filter)
    .populate({ path: 'records.hostelStudentId', populate: { path: 'studentId', populate: { path: 'userId', select: 'name' } } })
    .sort('-date')
    .lean();

  res.json(attendanceRecords);
});

// @desc    Get a student's own attendance (student/parent)
// @route   GET /api/hostel-attendance/my
const getStudentAttendance = asyncHandler(async (req, res) => {
  let studentId;

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new Error('Student profile not found');
    studentId = student._id;
  } else if (req.user.role === 'parent') {
    const childId = req.query.studentId;
    if (!childId) throw new Error('studentId query parameter required');
    studentId = await getVerifiedStudentId(req.user._id, childId);
    if (!studentId) {
      res.status(403);
      throw new Error('Access denied or invalid child');
    }
  } else {
    res.status(403);
    throw new Error('Access denied');
  }

  const hostelStudent = await HostelStudent.findOne({ studentId, status: 'active' }).lean();
  if (!hostelStudent) return res.json([]);

  const attendance = await HostelAttendance.find({
    hostelId: hostelStudent.hostelId,
    'records.hostelStudentId': hostelStudent._id,
  })
    .select('date records')
    .lean();

  const result = attendance.map((day) => {
    const studentRecord = day.records.find(
      (r) => r.hostelStudentId.toString() === hostelStudent._id.toString()
    );
    return {
      date: day.date,
      status: studentRecord?.status || 'unknown',
      remark: studentRecord?.remark || '',
    };
  });

  res.json(result);
});

// @desc    Get list of active hostel students (for attendance marking form)
// @route   GET /api/hostel-attendance/residents
const getResidentsForAttendance = asyncHandler(async (req, res) => {
  const hostel = await getWardenHostel(req.user._id);
  const residents = await getActiveResidents(hostel._id);
  res.json(residents);
});

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  getResidentsForAttendance,
};
