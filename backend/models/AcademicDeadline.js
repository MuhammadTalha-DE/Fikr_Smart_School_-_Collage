const mongoose = require('mongoose');

const AcademicDeadlineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    deadlineType: {
      type: String,
      enum: ['assignment', 'fee', 'admission', 'exam-form', 'other'],
      required: true,
    },
    dueDate: { type: Date, required: true },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    // For fee deadlines: linked fee plan
    feePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassFeePlan',
    },
    reminderBeforeDays: { type: Number, default: 3 },
    notified: { type: Boolean, default: false },  // for auto-notifications
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicDeadline', AcademicDeadlineSchema);