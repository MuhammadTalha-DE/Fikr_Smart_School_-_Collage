const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, required: true },
  capacity: { type: Number, required: true },          // how many beds
  occupiedBeds: { type: Number, default: 0 },
  roomType: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], default: 'double' },
  status: { type: String, enum: ['available', 'full', 'maintenance'], default: 'available' },
}, { timestamps: true });

// Ensure unique room within a hostel
roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('HostelRoom', roomSchema);