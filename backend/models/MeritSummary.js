const mongoose = require('mongoose');

const meritSummarySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  behaviourPoints: { type: Number, default: 0 },
  activityPoints: { type: Number, default: 0 },
  term: String,
  lastUpdated: Date,
}, { timestamps: true });

module.exports = mongoose.model('MeritSummary', meritSummarySchema);