const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,               // e.g., "2025-2026"
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    finalGrade: {                   // overall percentage
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['promoted', 'detained', 'transferred', 'completed'],
      default: 'promoted',
    },
    remarks: String,
  },
  { timestamps: true }
);

// Each student can have only one record per academic year
academicRecordSchema.index({ student: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);