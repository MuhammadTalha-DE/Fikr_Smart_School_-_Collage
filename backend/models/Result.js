const mongoose = require('mongoose');

const resultSchema = mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subjectResults: [{
    subject: String,
    marksObtained: Number,
    maxMarks: Number,
    percentage: Number,
    grade: String,
    gpa: Number,
  }],
  totalMarksObtained: Number,
  totalMaxMarks: Number,
  overallPercentage: Number,
  overallGrade: String,
  overallGPA: Number,
  classRank: Number,
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);