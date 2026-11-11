const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  name: { type: String, required: true },        // e.g. "First Term"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const academicYearSchema = new mongoose.Schema({
  name: { type: String, required: true },         // e.g. "2025‑2026"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  terms: [termSchema],
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);