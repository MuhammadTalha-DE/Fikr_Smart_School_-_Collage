const mongoose = require('mongoose');

const documentVerificationSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedDocument',
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  method: {
    type: String,
    enum: ['qr_scan', 'manual_code', 'api', 'admin'],
    default: 'manual_code',
  },
  status: {
    type: String,
    enum: ['valid', 'invalid', 'expired', 'revoked'],
    default: 'valid',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

documentVerificationSchema.index({ verificationCode: 1 });
documentVerificationSchema.index({ documentId: 1 });

module.exports = mongoose.model('DocumentVerification', documentVerificationSchema);
