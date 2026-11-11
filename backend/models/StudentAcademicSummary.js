const mongoose = require('mongoose');

const studentAcademicSummarySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    overall_attendance: { type: Number, default: 0 },
    average_marks: { type: Number, default: 0 },
    failed_subjects: { type: Number, default: 0 },
    behaviour_points: { type: Number, default: 0 },
    recent_negative_logs: { type: Number, default: 0 },
    course_coverage_percent: { type: Number, default: 0 },
    active_enrollment: { type: Boolean, default: true },
    last_updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAcademicSummary', studentAcademicSummarySchema);
