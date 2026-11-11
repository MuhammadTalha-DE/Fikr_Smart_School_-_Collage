const mongoose = require('mongoose');

const ptmMeetingSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    topic: { type: String, trim: true, required: true },
    scheduledAt: { type: Date, required: true },
    mode: {
      type: String,
      enum: ['on_campus', 'phone', 'online'],
      default: 'on_campus',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    parentResponseStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'reschedule_requested', 'declined'],
      default: 'pending',
    },
    parentResponseNote: { type: String, trim: true, default: '' },
    parentRespondedAt: { type: Date, default: null },
    studentAcknowledgedAt: { type: Date, default: null },
    studentReminderRequestedAt: { type: Date, default: null },
    studentReminderCount: { type: Number, default: 0 },
    parentName: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    outcome: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

ptmMeetingSchema.index({ teacherId: 1, scheduledAt: 1 });

module.exports = mongoose.model('PTMMeeting', ptmMeetingSchema);
