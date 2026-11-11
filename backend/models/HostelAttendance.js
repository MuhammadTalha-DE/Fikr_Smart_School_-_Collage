const mongoose = require('mongoose');

const hostelAttendanceSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [
      {
        hostelStudentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'HostelStudent',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'on_leave'],
          default: 'present',
        },
        remark: String,
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Each day can have only one attendance record per hostel
hostelAttendanceSchema.index({ hostelId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HostelAttendance', hostelAttendanceSchema);