const mongoose = require('mongoose');

const invigilationDutySchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    dutyDate: { type: Date, required: true },
    session: { type: String, trim: true, default: 'Morning' },
    roomLabel: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String, trim: true, default: '' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

invigilationDutySchema.index({ teacherId: 1, dutyDate: 1 });

module.exports = mongoose.model('InvigilationDuty', invigilationDutySchema);
