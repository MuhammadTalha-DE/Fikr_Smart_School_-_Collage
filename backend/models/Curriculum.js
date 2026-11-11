const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },          // e.g., “Grade 10 – Science Stream”
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        isCompulsory: { type: Boolean, default: true },
        creditHours: { type: Number },                // can override subject’s default credit
        sortOrder: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Each class+session combination should be unique
curriculumSchema.index({ class: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);