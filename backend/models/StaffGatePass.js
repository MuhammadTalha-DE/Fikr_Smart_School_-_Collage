const mongoose = require('mongoose');

const staffGatePassSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    passType: {
      type: String,
      enum: ['official_duty', 'temporary_exit', 'personal'],
      default: 'official_duty',
    },
    reason: { type: String, required: true },
    exitTime: { type: Date, required: true },
    returnTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'used', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffGatePass', staffGatePassSchema);
