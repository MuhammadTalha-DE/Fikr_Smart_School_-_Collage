const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['student', 'teacher', 'parent', 'admin'], required: true },
    type: { type: String, required: true },        // e.g., 'attendance_warning'
    message: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    source: { type: String, enum: ['rule_engine', 'ml_model', 'collaborative'], default: 'rule_engine' },
    seen: { type: Boolean, default: false },
    acted_upon: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },  // extra data (subject, link, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);