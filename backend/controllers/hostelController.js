const asyncHandler = require('express-async-handler');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');

const HostelRoom = require('../models/HostelRoom');
const HostelBed = require('../models/HostelBed');
const HostelStudent = require('../models/HostelStudent');
const auditService = require('../services/auditService');

// ─── Hostels ─────────────────────────────────
const getHostels = asyncHandler(async (req, res) => {
  const hostels = await Hostel.find().populate('wardenId', 'name email').lean();
  res.json(hostels);
});

const createHostel = asyncHandler(async (req, res) => {
  const { name, type, capacity, wardenId, address } = req.body;

  // Clean the wardenId – empty string → null
  const cleanWardenId = wardenId && wardenId.trim() !== '' ? wardenId : null;

  const hostel = await Hostel.create({
    name,
    type,
    capacity,
    wardenId: cleanWardenId,
    address,
  });

  auditService.log({
    action: 'CREATE',
    entity: 'Hostel',
    entityId: hostel._id,
    description: `Hostel "${name}" created`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(hostel);
});

const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hostel) {
    res.status(404);
    throw new Error('Hostel not found');
  }

  auditService.log({
    action: 'UPDATE',
    entity: 'Hostel',
    entityId: hostel._id,
    description: `Hostel "${hostel.name}" updated`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json(hostel);
});

const deleteHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    res.status(404);
    throw new Error('Hostel not found');
  }

  // Find all hostel rooms belonging to this hostel
  const rooms = await HostelRoom.find({ hostelId: hostel._id });
  const roomIds = rooms.map(r => r._id);

  // Delete all beds in those hostel rooms
  await HostelBed.deleteMany({ roomId: { $in: roomIds } });

  // Delete the hostel rooms themselves
  await HostelRoom.deleteMany({ hostelId: hostel._id });

  // Delete the hostel (use deleteOne, not .remove())
  await Hostel.deleteOne({ _id: hostel._id });

  // Mark any active hostel student records as 'left'
  await HostelStudent.updateMany(
    { hostelId: hostel._id, status: 'active' },
    { status: 'left', leaveDate: new Date() }
  );

  auditService.log({
    action: 'DELETE',
    entity: 'Hostel',
    entityId: hostel._id,
    description: `Hostel "${hostel.name}" deleted`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Hostel deleted' });
});

// ─── Rooms ────────────────────────────────────
const getRooms = asyncHandler(async (req, res) => {
  let filter = {};

  // Admin / Warden can filter by hostelId via query
  if (req.query.hostelId && ['admin', 'warden'].includes(req.user.role)) {
    filter.hostelId = req.query.hostelId;
  }

  // Student: only show rooms of the hostel they belong to
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return res.json([]);

    const hostelStudent = await HostelStudent.findOne({ studentId: student._id, status: 'active' }).lean();
    if (hostelStudent) {
      filter.hostelId = hostelStudent.hostelId;
    } else {
      // Student not in any hostel – return empty array
      return res.json([]);
    }
  }

  const rooms = await HostelRoom.find(filter).lean();
  res.json(rooms);
});

const createRoom = asyncHandler(async (req, res) => {
  const { hostelId, roomNumber, floor, capacity, roomType } = req.body;
  const room = await HostelRoom.create({ hostelId, roomNumber, floor, capacity, roomType });

  // Automatically create beds for this room
  const beds = [];
  for (let i = 1; i <= capacity; i++) {
    beds.push({ roomId: room._id, bedNumber: `B${i}` });
  }
  await HostelBed.insertMany(beds);

  auditService.log({
    action: 'CREATE',
    entity: 'HostelRoom',
    entityId: room._id,
    description: `Room ${roomNumber} created with ${capacity} beds`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(room);
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await HostelRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }
  auditService.log({
    action: 'UPDATE',
    entity: 'HostelRoom',
    entityId: room._id,
    description: `Room ${room.roomNumber} updated`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });
  res.json(room);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await HostelRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }
  // Delete all beds in this room
  await HostelBed.deleteMany({ roomId: room._id });
  // Delete the room itself (using deleteOne, not .remove())
  await HostelRoom.deleteOne({ _id: room._id });

  auditService.log({
    action: 'DELETE',
    entity: 'HostelRoom',
    entityId: room._id,
    description: `Room ${room.roomNumber} deleted`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Room deleted' });
});

// ─── Beds ─────────────────────────────────────
const getBeds = asyncHandler(async (req, res) => {
  let filter = {};

  // Admin / Warden can filter by roomId via query
  if (req.query.roomId && ['admin', 'warden'].includes(req.user.role)) {
    filter.roomId = req.query.roomId;
  }

  // Student: only show beds in their own room
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student) return res.json([]);

    const hostelStudent = await HostelStudent.findOne({ studentId: student._id, status: 'active' }).lean();
    if (!hostelStudent) return res.json([]);

    filter.roomId = hostelStudent.roomId;   // show only beds in the student’s room
  }

  const beds = await HostelBed.find(filter).lean();
  res.json(beds);
});

module.exports = {
  getHostels,
  createHostel,
  updateHostel,
  deleteHostel,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBeds,
};