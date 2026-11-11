const mongoose = require('mongoose');

const weeklyLoadSchema = mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, unique: true },
  loads: [{
    subject: { type: String, required: true },
    periods: { type: Number, required: true },       // max periods per week
  }],
});

module.exports = mongoose.model('WeeklyLoad', weeklyLoadSchema);