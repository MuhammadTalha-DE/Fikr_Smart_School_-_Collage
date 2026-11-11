const mongoose = require('mongoose');

const staffLeaveRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['casual', 'medical', 'annual', 'official', 'emergency'],
      default: 'casual',
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

staffLeaveRequestSchema.index({ userId: 1, createdAt: -1 });
staffLeaveRequestSchema.index({ status: 1, fromDate: 1 });

module.exports = mongoose.model('StaffLeaveRequest', staffLeaveRequestSchema);
