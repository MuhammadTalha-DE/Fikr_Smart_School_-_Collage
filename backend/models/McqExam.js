const mongoose = require('mongoose');

const mcqExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject: { type: String, required: true },
  duration: { type: Number, default: 30 },             // minutes
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],         // exactly 4
    correctOption: { type: Number, required: true },     // index 0‑3
    marks: { type: Number, default: 1 },
    explanation: String,
  }],
  isPublished: { type: Boolean, default: false },
  startTime: Date,
  endTime: Date,
}, { timestamps: true });
mcqExamSchema.index({ teacherId: 1 });
mcqExamSchema.index({ classId: 1 });
mcqExamSchema.index({ isPublished: 1, classId: 1 });

module.exports = mongoose.model('McqExam', mcqExamSchema);