

/*
const asyncHandler = require('express-async-handler');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const HostelBed = require('../models/HostelBed');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const HostelLeave = require('../models/HostelLeave');
const HostelComplaint = require('../models/HostelComplaint');
const HostelVisitor = require('../models/HostelVisitor');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const auditService = require('../services/auditService');

// â”€â”€ Helper: find warden's assigned hostel â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getWardenHostelId = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).lean();
  return hostel?._id || null;
};

// â”€â”€ GET /api/hostel-residents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//const getResidents = asyncHandler(async (req, res) => {
  try {
    const filter = { status: 'active' };

    if (req.user.role === 'warden') {
      const hostel = await Hostel.findOne({ wardenId: req.user._id }).lean();
      if (!hostel) {
        res.status(403);
        throw new Error('You are not assigned to a hostel');
      }
      filter.hostelId = hostel._id;
    } else if (req.user.role === 'admin' && req.query.hostelId) {
      filter.hostelId = req.query.hostelId;
    }

    const residents = await HostelStudent.find(filter)
      .populate({
        path: 'studentId',
        select: 'userId admissionNumber rollNumber classId',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          { path: 'classId', select: 'name' },
        ],
      })
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .lean();

    const result = residents.map(r => ({
      _id: r._id,
      student: {
        _id: r.studentId?._id,
        name: r.studentId?.userId?.name || 'Unknown',
        email: r.studentId?.userId?.email,
        avatar: r.studentId?.userId?.avatar || null,
        admissionNumber: r.studentId?.admissionNumber,
        rollNumber: r.studentId?.rollNumber,
        class: r.studentId?.classId?.name || 'N/A',
      },
      hostel: r.hostelId?.name || 'N/A',
      room: r.roomId?.roomNumber || 'N/A',
      bed: r.bedId?.bedNumber || 'N/A',
      joinDate: r.joinDate,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching residents:', error);
    throw error;
  }
//});
const getResidents = asyncHandler(async (req, res) => {
  console.log('ðŸŸ¢ getResidents called by', req.user.role, req.user._id);

  const filter = { status: 'active' };

  if (req.user.role === 'warden') {
    const hostel = await Hostel.findOne({ wardenId: req.user._id }).lean();
    if (!hostel) {
      res.status(403);
      throw new Error('You are not assigned to a hostel');
    }
    filter.hostelId = hostel._id;
    console.log('ðŸŸ¢ warden filter:', hostel._id);
  } else if (req.user.role === 'admin' && req.query.hostelId) {
    filter.hostelId = req.query.hostelId;
    console.log('ðŸŸ¢ admin hostel filter:', req.query.hostelId);
  }

  // 1. raw query (no population)
  const rawResidents = await HostelStudent.find(filter).lean();
  console.log(`ðŸŸ¢ found ${rawResidents.length} raw residents`);

  if (rawResidents.length === 0) {
    return res.json([]);   // truly empty
  }

  // 2. now populate
  try {
    const residents = await HostelStudent.find(filter)
      .populate({
        path: 'studentId',
        select: 'userId admissionNumber rollNumber classId',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          { path: 'classId', select: 'name' },
        ],
      })
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .lean();

    const result = residents.map(r => ({
      _id: r._id,
      student: {
        _id: r.studentId?._id,
        name: r.studentId?.userId?.name || 'Unknown',
        email: r.studentId?.userId?.email,
        avatar: r.studentId?.userId?.avatar || null,
        admissionNumber: r.studentId?.admissionNumber,
        rollNumber: r.studentId?.rollNumber,
        class: r.studentId?.classId?.name || 'N/A',
      },
      hostel: r.hostelId?.name || 'N/A',
      room: r.roomId?.roomNumber || 'N/A',
      bed: r.bedId?.bedNumber || 'N/A',
      joinDate: r.joinDate,
    }));

    console.log('ðŸŸ¢ returning', result.length, 'residents');
    res.json(result);
  } catch (populateError) {
    console.error('âŒ Population error:', populateError);
    // fallback: return raw data (without population)
    res.json(rawResidents.map(r => ({
      _id: r._id,
      student: { name: 'Unknown (see console)' },
      hostel: 'N/A',
      room: 'N/A',
      bed: 'N/A',
      joinDate: r.joinDate,
    })));
  }
});

// â”€â”€ GET /api/hostel-residents/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getResidentDetail = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id)
    .populate({
      path: 'studentId',
      select: 'userId admissionNumber rollNumber classId dateOfBirth bloodGroup',
      populate: [
        { path: 'userId', select: 'name email avatar' },
        { path: 'classId', select: 'name' },
      ],
    })
    .populate('hostelId', 'name')
    .populate('roomId', 'roomNumber')
    .populate('bedId', 'bedNumber')
    .lean();

  if (!resident) {
    res.status(404);
    throw new Error('Resident not found');
  }

  // Fetch related data
  const studentId = resident.studentId?._id;

  // Attendance summary (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const attendanceRecords = await Attendance.find({
    studentId,
    date: { $gte: thirtyDaysAgo },
  }).lean();
  const attendance = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'present').length,
    absent: attendanceRecords.filter(a => a.status === 'absent').length,
  };

  // Leaves
  const leaves = await HostelLeave.find({ hostelStudentId: resident._id })
    .sort('-createdAt')
    .lean();

  // Visitors
  const visitors = await HostelVisitor.find({ hostelStudentId: resident._id })
    .sort('-createdAt')
    .lean();

  // Complaints
  const complaints = await HostelComplaint.find({ hostelStudentId: resident._id })
    .sort('-createdAt')
    .lean();

  // Fee account
  const feeAccount = await StudentFeeAccount.findOne({ studentId, hostelId: resident.hostelId?._id })
    .populate('instalments')
    .lean();

  res.json({
    resident,
    attendance,
    leaves,
    visitors,
    complaints,
    feeAccount,
  });
});

// â”€â”€ POST /api/hostel-residents/:id/transfer â”€â”€â”€â”€â”€â”€
const transferStudent = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id);
  if (!resident || resident.status !== 'active') {
    res.status(404);
    throw new Error('Active resident not found');
  }

  const { newBedId } = req.body;   // new bed determines new room and hostel

  const newBed = await HostelBed.findById(newBedId);
  if (!newBed || newBed.status !== 'vacant') {
    res.status(400);
    throw new Error('Selected bed is not available');
  }

  const oldBed = await HostelBed.findById(resident.bedId);
  // Release old bed
  if (oldBed) {
    oldBed.studentId = null;
    oldBed.status = 'vacant';
    await oldBed.save();
    await HostelRoom.findByIdAndUpdate(oldBed.roomId, { $inc: { occupiedBeds: -1 } });
  }

  // Assign new bed
  newBed.studentId = resident.studentId;
  newBed.status = 'occupied';
  await newBed.save();

  const newRoom = await HostelRoom.findByIdAndUpdate(
    newBed.roomId,
    { $inc: { occupiedBeds: 1 } },
    { new: true }
  );

  // Update HostelStudent record
  const oldHostelId = resident.hostelId;
  resident.hostelId = newRoom.hostelId;
  resident.roomId = newBed.roomId;
  resident.bedId = newBed._id;
  await resident.save();

  auditService.log({
    action: 'TRANSFER',
    entity: 'HostelStudent',
    entityId: resident._id,
    description: `Student transferred from hostel ${oldHostelId} to ${newRoom.hostelId}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { hostelId: oldHostelId, roomId: oldBed?.roomId, bedId: oldBed?._id }, after: { hostelId: newRoom.hostelId, roomId: newBed.roomId, bedId: newBed._id } },
    req,
  });

  res.json({ message: 'Student transferred', resident });
});

// â”€â”€ DELETE /api/hostel-residents/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const removeStudent = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id);
  if (!resident || resident.status !== 'active') {
    res.status(404);
    throw new Error('Active resident not found');
  }

  // Release bed
  const bed = await HostelBed.findById(resident.bedId);
  if (bed) {
    bed.studentId = null;
    bed.status = 'vacant';
    await bed.save();
    await HostelRoom.findByIdAndUpdate(bed.roomId, { $inc: { occupiedBeds: -1 } });
  }

  resident.status = 'left';
  resident.leaveDate = new Date();
  await resident.save();

  auditService.log({
    action: 'REMOVE',
    entity: 'HostelStudent',
    entityId: resident._id,
    description: `Student removed from hostel`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Student removed from hostel' });
});

module.exports = { getResidents, getResidentDetail, transferStudent, removeStudent };

*/
const asyncHandler = require('express-async-handler');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const HostelBed = require('../models/HostelBed');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const HostelLeave = require('../models/HostelLeave');
const HostelComplaint = require('../models/HostelComplaint');
const HostelVisitor = require('../models/HostelVisitor');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const auditService = require('../services/auditService');

// Helper: get warden's hostel id
const getWardenHostelId = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).lean();
  return hostel?._id || null;
};

// GET /api/hostel-residents
const getResidents = asyncHandler(async (req, res) => {
  console.log('ðŸŸ¢ getResidents called by', req.user.role);

  const filter = { status: 'active' };

  if (req.user.role === 'warden') {
    const hostelId = await getWardenHostelId(req.user._id);
    if (!hostelId) {
      res.status(403);
      throw new Error('You are not assigned to a hostel');
    }
    filter.hostelId = hostelId;
  } else if (req.user.role === 'admin' && req.query.hostelId) {
    filter.hostelId = req.query.hostelId;
  }

  console.log('ðŸŸ¢ filter:', filter);

  // 1. Raw query
  const rawResidents = await HostelStudent.find(filter).lean();
  console.log(`ðŸŸ¢ found ${rawResidents.length} raw residents`);

  if (rawResidents.length === 0) {
    return res.json([]);
  }

  // 2. Populate
  try {
    const residents = await HostelStudent.find(filter)
      .populate({
        path: 'studentId',
        select: 'userId admissionNumber rollNumber classId',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          { path: 'classId', select: 'name' },
        ],
      })
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .lean();

    const result = residents.map(r => ({
      _id: r._id,
      student: {
        _id: r.studentId?._id,
        name: r.studentId?.userId?.name || 'Unknown',
        email: r.studentId?.userId?.email,
        avatar: r.studentId?.userId?.avatar || null,
        admissionNumber: r.studentId?.admissionNumber,
        rollNumber: r.studentId?.rollNumber,
        class: r.studentId?.classId?.name || 'N/A',
      },
      hostel: r.hostelId?.name || 'N/A',
      room: r.roomId?.roomNumber || 'N/A',
      bed: r.bedId?.bedNumber || 'N/A',
      joinDate: r.joinDate,
    }));

    console.log('ðŸŸ¢ returning', result.length, 'residents');
    res.json(result);
  } catch (populateError) {
    console.error('âŒ Population error:', populateError);
    // Fallback: return raw data without population
    res.json(rawResidents.map(r => ({
      _id: r._id,
      student: { name: 'Unknown (see console)', class: 'N/A', avatar: null },
      hostel: 'N/A',
      room: 'N/A',
      bed: 'N/A',
      joinDate: r.joinDate,
    })));
  }
});

// GET /api/hostel-residents/:id
const getResidentDetail = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id)
    .populate({
      path: 'studentId',
      select: 'userId admissionNumber rollNumber classId dateOfBirth bloodGroup',
      populate: [
        { path: 'userId', select: 'name email avatar' },
        { path: 'classId', select: 'name' },
      ],
    })
    .populate('hostelId', 'name')
    .populate('roomId', 'roomNumber')
    .populate('bedId', 'bedNumber')
    .lean();

  if (!resident) {
    res.status(404);
    throw new Error('Resident not found');
  }

  const studentId = resident.studentId?._id;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const attendanceRecords = await Attendance.find({
    studentId,
    date: { $gte: thirtyDaysAgo },
  }).lean();
  const attendance = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'present').length,
    absent: attendanceRecords.filter(a => a.status === 'absent').length,
  };

  const leaves = await HostelLeave.find({ hostelStudentId: resident._id }).sort('-createdAt').lean();
  const visitors = await HostelVisitor.find({ hostelStudentId: resident._id }).sort('-createdAt').lean();
  const complaints = await HostelComplaint.find({ hostelStudentId: resident._id }).sort('-createdAt').lean();
  const feeAccount = await StudentFeeAccount.findOne({ studentId, hostelId: resident.hostelId?._id }).lean();

  res.json({ resident, attendance, leaves, visitors, complaints, feeAccount });
});

// POST /api/hostel-residents/:id/transfer
const transferStudent = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id);
  if (!resident || resident.status !== 'active') {
    res.status(404);
    throw new Error('Active resident not found');
  }

  const { newBedId } = req.body;

  const newBed = await HostelBed.findById(newBedId);
  if (!newBed || newBed.status !== 'vacant') {
    res.status(400);
    throw new Error('Selected bed is not available');
  }

  const oldBed = await HostelBed.findById(resident.bedId);
  if (oldBed) {
    oldBed.studentId = null;
    oldBed.status = 'vacant';
    await oldBed.save();
    await HostelRoom.findByIdAndUpdate(oldBed.roomId, { $inc: { occupiedBeds: -1 } });
  }

  newBed.studentId = resident.studentId;
  newBed.status = 'occupied';
  await newBed.save();

  const newRoom = await HostelRoom.findByIdAndUpdate(
    newBed.roomId,
    { $inc: { occupiedBeds: 1 } },
    { new: true }
  );

  const oldHostelId = resident.hostelId;
  resident.hostelId = newRoom.hostelId;
  resident.roomId = newBed.roomId;
  resident.bedId = newBed._id;
  await resident.save();

  auditService.log({
    action: 'TRANSFER',
    entity: 'HostelStudent',
    entityId: resident._id,
    description: `Student transferred from hostel ${oldHostelId} to ${newRoom.hostelId}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { hostelId: oldHostelId, roomId: oldBed?.roomId, bedId: oldBed?._id }, after: { hostelId: newRoom.hostelId, roomId: newBed.roomId, bedId: newBed._id } },
    req,
  });

  res.json({ message: 'Student transferred', resident });
});

// DELETE /api/hostel-residents/:id
const removeStudent = asyncHandler(async (req, res) => {
  const resident = await HostelStudent.findById(req.params.id);
  if (!resident || resident.status !== 'active') {
    res.status(404);
    throw new Error('Active resident not found');
  }

  const bed = await HostelBed.findById(resident.bedId);
  if (bed) {
    bed.studentId = null;
    bed.status = 'vacant';
    await bed.save();
    await HostelRoom.findByIdAndUpdate(bed.roomId, { $inc: { occupiedBeds: -1 } });
  }

  resident.status = 'left';
  resident.leaveDate = new Date();
  await resident.save();

  auditService.log({
    action: 'REMOVE',
    entity: 'HostelStudent',
    entityId: resident._id,
    description: `Student removed from hostel`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Student removed from hostel' });
});

module.exports = { getResidents, getResidentDetail, transferStudent, removeStudent };
