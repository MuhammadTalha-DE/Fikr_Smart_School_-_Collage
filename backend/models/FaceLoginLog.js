const mongoose = require('mongoose');

const faceLoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  device: String,
  location: String,
  success: Boolean,
  confidence: Number,
  spoofDetected: { type: Boolean, default: false },
  spoofDetails: Object,
}, { timestamps: false });

// TTL index – auto‑delete logs older than 90 days
faceLoginLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 });

module.exports = mongoose.model('FaceLoginLog', faceLoginLogSchema); 