const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: Date,
  maxMarks: { type: Number, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);