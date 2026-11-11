const mongoose = require('mongoose');

const hostelStudentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  joinDate: { type: Date, default: Date.now },
  leaveDate: { type: Date, default: null },
  status: { type: String, enum: ['active', 'left'], default: 'active' },
}, { timestamps: true });

hostelStudentSchema.index({ studentId: 1 }, { unique: true });  // one hostel record per student

module.exports = mongoose.model('HostelStudent', hostelStudentSchema);