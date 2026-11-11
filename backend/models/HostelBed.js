const mongoose = require('mongoose');

const hostelBedSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom',
    required: true,
  },
  bedNumber: { type: String, required: true },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null,
  },
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'reserved', 'maintenance'],
    default: 'vacant',
  },
}, { timestamps: true });

hostelBedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('HostelBed', hostelBedSchema);