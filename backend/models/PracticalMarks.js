const mongoose = require('mongoose');

const practicalMarksSchema = mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  labSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabSession', required: true },
  experimentName: String,
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  remarks: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PracticalMarks', practicalMarksSchema);