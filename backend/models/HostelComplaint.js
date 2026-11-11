const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  hostelStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelStudent',
    required: true,
  },
  category: {
    type: String,
    enum: ['electrical', 'plumbing', 'furniture', 'cleanliness', 'other'],
    required: true,
  },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: String,
}, { timestamps: true });

module.exports = mongoose.model('HostelComplaint', complaintSchema);