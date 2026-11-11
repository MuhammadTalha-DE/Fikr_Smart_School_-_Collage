const mongoose = require('mongoose');

const hostelVisitorSchema = new mongoose.Schema({
  hostelStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelStudent',
    required: true
 },
  visitorName: { type: String, required: true },
  relation: { type: String, default: '' },
  purpose: { type: String, default: '' },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'checked_in', 'checked_out'],
    default: 'pending'
 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('HostelVisitor', hostelVisitorSchema);