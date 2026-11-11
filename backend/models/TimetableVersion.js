const mongoose = require('mongoose');

const timetableVersionSchema = mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true },
  academicYear: { type: String, required: true },
  scheduleType: { type: String, enum: ['regular', 'ramadan', 'exam', 'half-day', 'custom'], default: 'regular' },
  validFrom: { type: Date, default: null },
  validUntil: { type: Date, default: null },
  slots: [{ type: mongoose.Schema.Types.Mixed }],      // snapshot of slots array
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('TimetableVersion', timetableVersionSchema);
