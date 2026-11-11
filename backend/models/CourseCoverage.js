const mongoose = require('mongoose');

const courseCoverageSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    syllabusUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SyllabusUnit',
      required: true,
    },
    coveredTopics: [
      {
        name: String,
        coveredDate: Date,
        remarks: String,
      },
    ],
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    coveragePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Each combination of teacher, class, subject, and unit must be unique
courseCoverageSchema.index(
  { teacher: 1, class: 1, subject: 1, syllabusUnit: 1 },
  { unique: true }
);

module.exports = mongoose.model('CourseCoverage', courseCoverageSchema);