const mongoose = require('mongoose');

const complianceDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    category: {
      type: String,
      enum: ['policy', 'contract', 'staff', 'student', 'finance', 'safety', 'clinic', 'security', 'regulatory'],
      default: 'policy',
    },
    ownerRole: { type: String, trim: true, default: 'admin' },
    linkedModule: { type: String, trim: true, default: 'system' },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'active', 'review_due', 'expired', 'archived'],
      default: 'active',
    },
    visibility: {
      type: String,
      enum: ['admin', 'staff', 'restricted'],
      default: 'admin',
    },
    documentUrl: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

complianceDocumentSchema.index({ status: 1, dueDate: 1, category: 1 });

module.exports = mongoose.model('ComplianceDocument', complianceDocumentSchema);
