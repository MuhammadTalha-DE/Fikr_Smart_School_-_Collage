const asyncHandler = require('express-async-handler');
const Hostel = require('../models/Hostel');
const Room = require('../models/HostelRoom');
const Bed = require('../models/Bed');
const HostelStudent = require('../models/HostelStudent');
const HostelAttendance = require('../models/HostelAttendance');
const HostelComplaint = require('../models/HostelComplaint');
const StudentFeeAccount = require('../models/StudentFeeAccount');

// ─── Occupancy Stats ────────────────────────
// @desc    Get occupancy statistics (admin sees all, warden sees own hostel)
// @route   GET /api/hostel-analytics/occupancy
const getOccupancyStats = asyncHandler(async (req, res) => {
  let hostelFilter = {};
  if (req.user.role === 'warden') {
    const hostel = await Hostel.findOne({ wardenId: req.user._id });
    if (!hostel) {
      res.status(403);
      throw new Error('You are not assigned to a hostel');
    }
    hostelFilter = { _id: hostel._id };
  }

  const hostels = await Hostel.find(hostelFilter).lean();
  const stats = await Promise.all(hostels.map(async (hostel) => {
    const rooms = await Room.find({ hostelId: hostel._id }).lean();
    const totalBeds = await Bed.countDocuments({ roomId: { $in: rooms.map(r => r._id) } });
    const occupiedBeds = await Bed.countDocuments({ roomId: { $in: rooms.map(r => r._id) }, status: 'occupied' });
    const activeStudents = await HostelStudent.countDocuments({ hostelId: hostel._id, status: 'active' });
    return {
      hostelId: hostel._id,
      hostelName: hostel.name,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
      activeStudents,
    };
  }));
  res.json(stats);
});

// ─── Today's Attendance ─────────────────────
const getTodayAttendance = asyncHandler(async (req, res) => {
  let hostelId = null;
  if (req.user.role === 'warden') {
    const hostel = await Hostel.findOne({ wardenId: req.user._id });
    if (!hostel) throw new Error('Not assigned to a hostel');
    hostelId = hostel._id;
  } else if (req.query.hostelId) {
    hostelId = req.query.hostelId;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filter = { date: { $gte: today, $lt: tomorrow } };
  if (hostelId) filter.hostelId = hostelId;

  const attendance = await HostelAttendance.findOne(filter).lean();
  if (!attendance) return res.json({ present: 0, absent: 0, onLeave: 0, total: 0 });

  const present = attendance.records.filter(r => r.status === 'present').length;
  const absent = attendance.records.filter(r => r.status === 'absent').length;
  const onLeave = attendance.records.filter(r => r.status === 'on_leave').length;
  res.json({ present, absent, onLeave, total: attendance.records.length });
});

// ─── Attendance Trend (last 7 days) ─────────
const getAttendanceTrend = asyncHandler(async (req, res) => {
  let hostelId = null;
  if (req.user.role === 'warden') {
    const hostel = await Hostel.findOne({ wardenId: req.user._id });
    if (!hostel) throw new Error('Not assigned to a hostel');
    hostelId = hostel._id;
  } else if (req.query.hostelId) {
    hostelId = req.query.hostelId;
  }

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }

  const filter = { date: { $in: days } };
  if (hostelId) filter.hostelId = hostelId;

  const records = await HostelAttendance.find(filter).sort('date').lean();
  const trend = days.map(date => {
    const record = records.find(r => r.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    return {
      date: date.toISOString().slice(0, 10),
      present: record ? record.records.filter(r => r.status === 'present').length : 0,
      absent: record ? record.records.filter(r => r.status === 'absent').length : 0,
      onLeave: record ? record.records.filter(r => r.status === 'on_leave').length : 0,
    };
  });
  res.json(trend);
});

// ─── Pending Approvals ──────────────────────
const getPendingApprovals = asyncHandler(async (req, res) => {
  let hostelFilter = {};
  if (req.user.role === 'warden') {
    const hostel = await Hostel.findOne({ wardenId: req.user._id });
    if (!hostel) throw new Error('Not assigned to a hostel');
    const residents = await HostelStudent.find({ hostelId: hostel._id, status: 'active' }).select('_id').lean();
    hostelFilter = { hostelStudentId: { $in: residents.map(r => r._id) } };
  }

  const pendingLeaves = require('../models/HostelLeave').countDocuments({ ...hostelFilter, status: 'pending' });
  const pendingVisitors = require('../models/HostelVisitor').countDocuments({ ...hostelFilter, status: 'pending' });
  const pendingComplaints = HostelComplaint.countDocuments({ status: 'open' }); // all open for admin

  const [leaves, visitors, complaints] = await Promise.all([pendingLeaves, pendingVisitors, pendingComplaints]);

  res.json({ pendingLeaves: leaves, pendingVisitors: visitors, pendingComplaints: complaints });
});

// ─── Complaint Summary (by status) ──────────
const getComplaintSummary = asyncHandler(async (req, res) => {
  const open = await HostelComplaint.countDocuments({ status: 'open' });
  const inProgress = await HostelComplaint.countDocuments({ status: 'in_progress' });
  const resolved = await HostelComplaint.countDocuments({ status: 'resolved' });
  res.json({ open, inProgress, resolved });
});

// ─── Fee Collection Summary ─────────────────
const getFeeCollection = asyncHandler(async (req, res) => {
  // Hostel fee accounts only
  const accounts = await StudentFeeAccount.find({ hostelId: { $ne: null } }).lean();
  const totalAmount = accounts.reduce((sum, a) => sum + a.totalAmount, 0);
  const paidAmount = accounts.reduce((sum, a) => sum + a.paidAmount, 0);
  res.json({
    totalAccounts: accounts.length,
    totalAmount,
    paidAmount,
    dueAmount: totalAmount - paidAmount,
  });
});

module.exports = {
  getOccupancyStats,
  getTodayAttendance,
  getAttendanceTrend,
  getPendingApprovals,
  getComplaintSummary,
  getFeeCollection,
};