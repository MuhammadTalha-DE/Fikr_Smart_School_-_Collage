const mongoose = require('mongoose');
const classSchema = mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  grade: { type: String, default: '' },   // optional, e.g., "9th", "10th", "O Level"
  subjects: [String],
});
module.exports = mongoose.model('Class', classSchema);
