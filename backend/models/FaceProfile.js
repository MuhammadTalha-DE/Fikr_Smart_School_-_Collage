const mongoose = require('mongoose');

const faceProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  embeddings: [[Number]],                          // array of 128‑dim arrays
  faceImages: [String],                            // base64 or Cloudinary URLs
  enrollmentStatus: {
    type: String,
    enum: ['pending', 'complete', 'failed'],
    default: 'pending',
  },
  lastVerified: Date,
  deviceInfo: {
    browser: String,
    os: String,
    camera: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('FaceProfile', faceProfileSchema);