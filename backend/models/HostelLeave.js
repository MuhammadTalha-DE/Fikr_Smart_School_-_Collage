const mongoose = require('mongoose');

const hostelLeaveSchema = new mongoose.Schema({
  hostelStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelStudent',
    required: true
 },
  leaveType: {
    type: String,
    enum: ['weekend', 'emergency', 'medical', 'other'],
    required: true
 },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('HostelLeave', hostelLeaveSchema);