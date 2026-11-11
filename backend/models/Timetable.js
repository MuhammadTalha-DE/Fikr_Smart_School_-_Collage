const mongoose = require('mongoose');

// Slot schema – each period has optional room
const timetableSlotSchema = mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  period: { type: Number, required: true, min: 1, max: 12 },
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },   // ✅ Add here
});

// Main timetable schema (no roomId needed at this level)
const timetableSchema = mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    term: {
      type: String,
      enum: ['First Term', 'Second Term', 'Final Term'],
      required: true,
    },
    academicYear: { type: String, required: true },
    scheduleType: { type: String, enum: ['regular', 'ramadan', 'exam', 'half-day', 'custom'], default: 'regular' },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },

    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isActive: { type: Boolean, default: true },
    slots: [timetableSlotSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timetableSchema.index(
  { classId: 1, term: 1, academicYear: 1, scheduleType: 1 },
  { unique: true }
);
timetableSchema.index({ classId: 1, scheduleType: 1, status: 1, isActive: 1 });
timetableSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
