const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
  name: { type: String, required: true },                     // e.g., "Mid-Term 2025"
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjects: [{ type: String, required: true }],
  date: { type: Date, required: true },
  session: { type: String, enum: ['Morning', 'Afternoon'], default: 'Morning' },
  maxMarks: { type: Number, default: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);