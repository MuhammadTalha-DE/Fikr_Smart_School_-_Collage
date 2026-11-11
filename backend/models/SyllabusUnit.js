const mongoose = require('mongoose');

const syllabusUnitSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    curriculum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      required: true,
    },
    title: { type: String, required: true, trim: true },       // e.g., "Integration Techniques"
    description: { type: String, default: '' },
    unitNumber: { type: Number, required: true },               // order in syllabus
    weekNumber: { type: Number },                               // planned teaching week (optional)
    topics: [
      {
        name: { type: String, required: true },
        subtopics: [String],
        estimatedLessons: { type: Number, default: 1 },        // number of periods needed
      },
    ],
    learningOutcomes: [String],                                 // e.g., CLOs, PLOs
    isComplete: { type: Boolean, default: false },              // for coverage tracking
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Each combination of subject + curriculum + unitNumber must be unique
syllabusUnitSchema.index({ subject: 1, curriculum: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusUnit', syllabusUnitSchema);