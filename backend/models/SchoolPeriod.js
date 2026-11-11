const mongoose = require('mongoose');

const schoolPeriodSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true, min: 1, max: 12 },
  startTime: { type: String, required: true },   // "08:25"
  endTime: { type: String, required: true },     // "09:05"
  type: { type: String, enum: ['class', 'assembly', 'break', 'lunch', 'dispersal'], default: 'class' },
  bellEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SchoolPeriod', schoolPeriodSchema);