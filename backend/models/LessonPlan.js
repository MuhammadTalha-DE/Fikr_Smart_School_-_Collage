const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema(
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
    weekNumber: { type: Number, required: true },
    date: { type: Date },               // specific day (optional)
    title: { type: String, required: true },
    objectives: [String],
    materials: [String],
    activities: [String],
    evaluation: [String],
    linkedSyllabusUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SyllabusUnit',
      },
    ],
    isCompleted: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true }
);

lessonPlanSchema.index({ teacher: 1, class: 1, subject: 1, weekNumber: 1 });

module.exports = mongoose.model('LessonPlan', lessonPlanSchema);