const mongoose = require('mongoose');
const attendanceSchema = mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'leave', 'medical_leave'], 
    required: true 
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: { 
    type: String, 
    enum: ['manual', 'qr', 'biometric', 'rfid', 'bulk'], 
    default: 'manual' 
  },
  remarks: { type: String, default: '' },
  qrCodeId: { type: String, default: null },
});

attendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ studentId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
