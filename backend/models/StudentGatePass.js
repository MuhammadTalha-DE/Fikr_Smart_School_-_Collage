const mongoose = require('mongoose');

const studentGatePassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    passType: {
      type: String,
      enum: ['early_departure', 'temporary_exit'],
      default: 'early_departure',
    },
    reason: { type: String, required: true },
    guardianName: { type: String, default: '' },
    exitTime: { type: Date, required: true },
    returnTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'used', 'rejected'],
      default: 'pending',
    },
    parentResponseStatus: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'concern'],
      default: 'pending',
    },
    parentResponseNote: { type: String, default: '' },
    parentRespondedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentGatePass', studentGatePassSchema);
