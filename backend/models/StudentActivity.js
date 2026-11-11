const mongoose = require('mongoose');

const studentActivitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  activityName: { type: String, required: true },
  category: {
    type: String,
    enum: ['sports', 'cultural', 'club', 'community_service', 'academic', 'other'],
    required: true,
  },
  role: { type: String, enum: ['participant', 'winner', 'organizer', 'leader'], default: 'participant' },
  achievement: String,
  eventDate: Date,
  term: String,
  points: { type: Number, default: 0 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: true });

module.exports = mongoose.model('StudentActivity', studentActivitySchema);