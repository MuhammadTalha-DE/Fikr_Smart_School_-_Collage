const mongoose = require('mongoose');

const studentInterventionSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    category: {
      type: String,
      enum: ['academic', 'attendance', 'behaviour', 'wellbeing', 'parent_followup'],
      default: 'academic',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'monitoring', 'resolved'],
      default: 'open',
    },
    concern: { type: String, trim: true, required: true },
    actionPlan: { type: String, trim: true, default: '' },
    followUpDate: { type: Date, default: null },
    parentInformed: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

studentInterventionSchema.index({ teacherId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('StudentIntervention', studentInterventionSchema);
