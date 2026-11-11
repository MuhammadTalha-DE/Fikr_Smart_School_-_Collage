const TransportAttendance = require('../models/TransportAttendance');
const TransportAllocation = require('../models/TransportAllocation');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');

// ============================================================
// MARK TRANSPORT ATTENDANCE
// ============================================================
const markTransportAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!records?.length) {
    res.status(400);
    throw new Error('Records are required');
  }

  const ops = records.map(rec => ({
    updateOne: {
      filter: {
        studentId: rec.studentId,
        date: rec.date,
        tripType: rec.tripType || 'both',
      },
      update: {
        $set: {
          studentId: rec.studentId,
          routeId: rec.routeId,
          vehicleId: rec.vehicleId,
          date: rec.date,
          tripType: rec.tripType || 'both',
          boarded: rec.boarded || false,
          dropped: rec.dropped || false,
          boardedTime: rec.boardedTime || null,
          droppedTime: rec.droppedTime || null,
          confirmedBy: req.user._id,
          remarks: rec.remarks || '',
        },
      },
      upsert: true,
    },
  }));

  await TransportAttendance.bulkWrite(ops);
  res.json({ message: 'Transport attendance saved', count: records.length });
});

// ============================================================
// GET TRANSPORT ATTENDANCE
// ============================================================
const getTransportAttendance = asyncHandler(async (req, res) => {
  const { routeId, vehicleId, date, studentId, startDate, endDate } = req.query;
  const filter = {};
  if (routeId) filter.routeId = routeId;
  if (vehicleId) filter.vehicleId = vehicleId;
  if (studentId) filter.studentId = studentId;
  if (date) filter.date = new Date(date);
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await TransportAttendance.find(filter)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name rollNumber' },
    })
    .populate('routeId', 'name')
    .populate('vehicleId', 'vehicleNumber')
    .sort({ date: -1 });

  res.json(records);
});

// ============================================================
// GET TRANSPORT STATS
// ============================================================
const getTransportStats = asyncHandler(async (req, res) => {
  const { routeId, startDate, endDate } = req.query;
  const filter = {};
  if (routeId) filter.routeId = routeId;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await TransportAttendance.find(filter);
  const total = records.length;
  const boarded = records.filter(r => r.boarded).length;
  const dropped = records.filter(r => r.dropped).length;

  res.json({
    total,
    boarded,
    dropped,
    notBoarded: total - boarded,
    boardedPercentage: total > 0 ? Math.round((boarded / total) * 100) : 0,
  });
});

// ============================================================
// GET STUDENT'S TRANSPORT ATTENDANCE (for parent/student view)
// ============================================================
const getMyTransportAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const records = await TransportAttendance.find({ studentId: student._id })
    .populate('routeId', 'name')
    .populate('vehicleId', 'vehicleNumber')
    .sort({ date: -1 })
    .limit(60);

  res.json(records);
});

module.exports = {
  markTransportAttendance,
  getTransportAttendance,
  getTransportStats,
  getMyTransportAttendance,
};
