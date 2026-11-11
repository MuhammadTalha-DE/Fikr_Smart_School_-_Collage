const mongoose = require('mongoose');

const hostelApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: '' },
  documents: [{ type: String }],              // array of file URLs (optional)
}, { timestamps: true });

module.exports = mongoose.model('HostelApplication', hostelApplicationSchema);