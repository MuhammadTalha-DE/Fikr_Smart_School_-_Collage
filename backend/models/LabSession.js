const mongoose = require('mongoose');

const labSessionSchema = mongoose.Schema({
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, required: true },
  startTime: String,
  endTime: String,
  topic: String,                                    // experiment / topic of the day
  attendance: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['present','absent'], default: 'present' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('LabSession', labSessionSchema);