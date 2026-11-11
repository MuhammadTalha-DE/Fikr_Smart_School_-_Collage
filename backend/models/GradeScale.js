const mongoose = require('mongoose');

const gradeScaleSchema = mongoose.Schema({
  letter: { type: String, required: true },   // A, B, C, D, F
  minPercentage: { type: Number, required: true },
  maxPercentage: { type: Number, required: true },
  gpa: { type: Number, required: true },       // 4.0, 3.0, …
});

module.exports = mongoose.model('GradeScale', gradeScaleSchema);