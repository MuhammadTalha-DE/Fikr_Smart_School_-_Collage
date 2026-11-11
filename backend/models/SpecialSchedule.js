const mongoose = require('mongoose');

const specialScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },          // e.g. "Ramadan 2025"
  scheduleType: { type: String, enum: ['ramadan', 'exam', 'half-day', 'custom'], required: true },
  academicYear: { type: String, required: true },  // e.g. "2025-2026"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SpecialSchedule', specialScheduleSchema);