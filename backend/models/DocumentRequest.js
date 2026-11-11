const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerType: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'staff', 'parent'],
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
  documentType: {
    type: String,
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    default: null,
  },
  reason: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'generated'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  generatedDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedDocument',
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

documentRequestSchema.index({ status: 1, requestedBy: 1 });
documentRequestSchema.index({ documentType: 1 });

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
