const mongoose = require('mongoose');

const mcqSubmissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'McqExam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean,
  }],
  score: Number,
  totalMarks: Number,
  submittedAt: { type: Date, default: Date.now },
  timeTaken: Number,          // seconds
}, { timestamps: true });
mcqSubmissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });
mcqSubmissionSchema.index({ examId: 1 });
mcqSubmissionSchema.index({ studentId: 1 });

module.exports = mongoose.model('McqSubmission', mcqSubmissionSchema);