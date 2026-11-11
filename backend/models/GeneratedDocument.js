const mongoose = require('mongoose');

const generatedDocumentSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    required: true,
  },
  documentType: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  ownerType: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'staff', 'parent', 'user'],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'ownerModel',
  },
  ownerModel: {
    type: String,
    required: true,
    enum: ['Student', 'Teacher', 'User', 'Parent'],
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  verificationCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  qrCodeDataUrl: {
    type: String,
    default: null,
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  pdfBuffer: {
    type: Buffer,
    default: null,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'issued', 'revoked', 'expired'],
    default: 'generated',
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tags: [{
    type: String,
  }],
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

generatedDocumentSchema.index({ ownerType: 1, ownerId: 1 });
generatedDocumentSchema.index({ verificationCode: 1 });
generatedDocumentSchema.index({ status: 1 });
generatedDocumentSchema.index({ documentType: 1 });

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
