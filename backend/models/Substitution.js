const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  absentTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', default: null },
  date: { type: Date, required: true },
  period: { type: Number, required: true },
  subject: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'assigned', 'cancelled'], default: 'pending' },
}, { timestamps: true });

substitutionSchema.index({ classId: 1, date: 1, period: 1, absentTeacherId: 1 }, { unique: true });
substitutionSchema.index({ substituteTeacherId: 1, date: 1, period: 1, status: 1 });

module.exports = mongoose.model('Substitution', substitutionSchema);
