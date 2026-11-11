const TeacherAttendance = require('../models/TeacherAttendance');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');

// ============================================================
// MARK TEACHER ATTENDANCE (Admin or self check-in)
// ============================================================
const markTeacherAttendance = asyncHandler(async (req, res) => {
  const { teacherId, date, status, checkIn, checkOut, remarks } = req.body;
  
  let targetTeacherId = teacherId;
  
  // If teacher is marking own attendance
  if (!targetTeacherId && req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    targetTeacherId = teacher?._id;
  }

  if (!targetTeacherId) {
    res.status(400);
    throw new Error('Teacher ID is required');
  }

  // Calculate late minutes if check-in is provided
  let lateMinutes = 0;
  if (checkIn) {
    const checkInTime = new Date(checkIn);
    const schoolStart = new Date(checkIn);
    schoolStart.setHours(8, 0, 0, 0); // Assuming 8:00 AM school start
    if (checkInTime > schoolStart) {
      lateMinutes = Math.round((checkInTime - schoolStart) / 60000);
    }
  }

  const attendance = await TeacherAttendance.findOneAndUpdate(
    { teacherId: targetTeacherId, date },
    {
      $set: {
        teacherId: targetTeacherId,
        userId: req.user._id,
        date,
        status: status || 'present',
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        lateMinutes,
        markedBy: req.user._id,
        remarks: remarks || '',
      },
    },
    { upsert: true, new: true }
  );

  res.json(attendance);
});

// ============================================================
// GET TEACHER ATTENDANCE
// ============================================================
const getTeacherAttendance = asyncHandler(async (req, res) => {
  const { teacherId, date, startDate, endDate } = req.query;
  const filter = {};
  
  if (teacherId) filter.teacherId = teacherId;
  if (date) filter.date = new Date(date);
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await TeacherAttendance.find(filter)
    .populate({
      path: 'teacherId',
      populate: { path: 'userId', select: 'name email' },
    })
    .sort({ date: -1 });

  res.json(records);
});

// ============================================================
// GET TEACHER ATTENDANCE STATS
// ============================================================
const getTeacherStats = asyncHandler(async (req, res) => {
  const { teacherId, startDate, endDate } = req.query;
  
  let targetTeacherId = teacherId;
  if (!targetTeacherId && req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    targetTeacherId = teacher?._id;
  }

  const filter = {};
  if (targetTeacherId) filter.teacherId = targetTeacherId;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await TeacherAttendance.find(filter);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const leave = records.filter(r => r.status === 'leave' || r.status === 'half_day').length;

  res.json({
    total,
    present,
    absent,
    late,
    leave,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    totalLateMinutes: records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
  });
});

// ============================================================
// TEACHER CHECK-IN (Quick self check-in)
// ============================================================
const teacherCheckIn = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await TeacherAttendance.findOne({
    teacherId: teacher._id,
    date: today,
  });

  if (existing && existing.checkIn) {
    res.status(400);
    throw new Error('Already checked in today');
  }

  const now = new Date();
  const schoolStart = new Date();
  schoolStart.setHours(8, 0, 0, 0);
  const lateMinutes = now > schoolStart ? Math.round((now - schoolStart) / 60000) : 0;

  const attendance = await TeacherAttendance.findOneAndUpdate(
    { teacherId: teacher._id, date: today },
    {
      $set: {
        teacherId: teacher._id,
        userId: req.user._id,
        date: today,
        status: lateMinutes > 15 ? 'late' : 'present',
        checkIn: now,
        lateMinutes,
        markedBy: req.user._id,
      },
    },
    { upsert: true, new: true }
  );

  res.json({ message: 'Check-in successful', attendance, lateMinutes });
});

// ============================================================
// TEACHER CHECK-OUT
// ============================================================
const teacherCheckOut = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await TeacherAttendance.findOne({
    teacherId: teacher._id,
    date: today,
  });

  if (!attendance) {
    res.status(400);
    throw new Error('No check-in record found for today');
  }

  if (attendance.checkOut) {
    res.status(400);
    throw new Error('Already checked out today');
  }

  attendance.checkOut = new Date();
  await attendance.save();

  res.json({ message: 'Check-out successful', attendance });
});

module.exports = {
  markTeacherAttendance,
  getTeacherAttendance,
  getTeacherStats,
  teacherCheckIn,
  teacherCheckOut,
};
