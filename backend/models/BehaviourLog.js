const mongoose = require('mongoose');

const behaviourLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  category: {
    type: String,
    enum: [
      'helping_others', 'excellent_participation', 'leadership', 'teamwork',
      'disruptive', 'late_to_class', 'homework_not_done',
      'bullying', 'vandalism', 'cheating', 'other'
    ],
    required: true,
  },
  type: { type: String, enum: ['positive', 'negative'], required: true },
  severity: { type: String, enum: ['minor', 'moderate', 'serious'], default: 'minor' },
  points: { type: Number, default: 0 },         // +ve for positive, -ve for negative
  description: String,
  date: { type: Date, default: Date.now },
  term: String,                                   // e.g., "First Term 2025-2026"
  acknowledged: { type: Boolean, default: false },
}, { timestamps: true });

behaviourLogSchema.index({ student: 1, date: -1 });
behaviourLogSchema.index({ class: 1, date: -1 });
behaviourLogSchema.index({ teacher: 1 });

module.exports = mongoose.model('BehaviourLog', behaviourLogSchema);