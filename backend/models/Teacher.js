const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subjects: [String],
  preferredSubjects: [String],
  preferredGrades: [String],
});

module.exports = mongoose.model('Teacher', teacherSchema);