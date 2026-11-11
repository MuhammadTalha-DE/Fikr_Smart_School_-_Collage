const mongoose = require('mongoose');

const AcademicEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    eventType: {
      type: String,
      enum: [
        'holiday',
        'exam',
        'sports',
        'cultural',
        'meeting',
        'result',
        'other',
      ],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },   // same as start for single day
    isAllDay: { type: Boolean, default: true },
    color: { type: String, default: '#3b82f6' },  // for UI
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    // Optional: link to a specific class if it's a class-only event
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    // Whether to use this event to automatically adjust timetable (e.g., no school)
    affectsTimetable: { type: Boolean, default: true },
    scheduleEffect: {
      type: String,
      enum: ['none', 'cancel', 'shorten', 'override'],
      default: null,
    },
    scheduleTypeOverride: {
      type: String,
      enum: ['regular', 'ramadan', 'exam', 'half-day', 'custom'],
      default: null,
    },
    activePeriods: [{ type: Number, min: 1, max: 12 }],
    cancelledPeriods: [{ type: Number, min: 1, max: 12 }],
    timetableNote: { type: String, default: '' },
  },
  { timestamps: true }
);

AcademicEventSchema.index({ startDate: 1, endDate: 1 });
AcademicEventSchema.index({ affectsTimetable: 1, targetClass: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('AcademicEvent', AcademicEventSchema);
