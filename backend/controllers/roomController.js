const Room = require('../models/Room');
const asyncHandler = require('express-async-handler');

const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json(room);
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!room) throw new Error('Room not found');
  res.json(room);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new Error('Room not found');
  await room.deleteOne();
  res.json({ message: 'Room deleted' });
});

module.exports = { getRooms, createRoom, updateRoom, deleteRoom };