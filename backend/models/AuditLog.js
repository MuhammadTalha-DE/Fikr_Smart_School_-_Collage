// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // ───── What happened ─────
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'CREATE',
        'UPDATE',
        'UPSERT',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'EXPORT',
        'IMPORT',
        'GENERATE',
        'ACCEPT',
        'APPROVE',
        'REJECT',
        'PUBLISH',
        'ROLLBACK',
        'CLEAR_ALL',
        'TRANSFER',
        'REMOVE',
        'READ',
        'MARK_READ',
        'MARK_ALL_READ',
        'CONFIGURE',
        'SEND_NOTIFICATION',
        'UPDATE_NOTIFICATION',
        'DELETE_NOTIFICATION',
        'BULK_DELETE_NOTIFICATIONS',
      ],
    },

    module: {
      type: String,
      default: 'general',
      trim: true,
      maxlength: 80,
    },

    status: {
      type: String,
      enum: ['success', 'warning', 'failure'],
      default: 'success',
    },

    // ───── Which record was affected ─────
    entity: {
      type: String,
      required: [true, 'Entity name is required'],
      // e.g. 'Student', 'FeeInstallment', 'Exam', 'Admission'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ───── Human‑readable description ─────
    description: {
      type: String,
      required: [true, 'A description is required'],
      maxlength: 500,
    },

    // ───── Who performed the action ─────
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role:   { type: String },   // 'admin', 'teacher', etc.
      name:   { type: String },   // display name
    },

    // ───── What changed (optional before/after snapshot) ─────
    changes: {
      type: Object,
      default: null,
      // example: { before: { status: 'pending' }, after: { status: 'accepted' } }
    },

    // ───── Technical metadata ─────
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      method: { type: String },
      path: { type: String },
      reference: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }   // adds createdAt & updatedAt automatically
);

// ───── Indexes for the audit dashboard ─────
auditLogSchema.index({ 'metadata.timestamp': -1 });             // recent logs first
auditLogSchema.index({ entity: 1, entityId: 1 });               // lookup by record
auditLogSchema.index({ 'performedBy.userId': 1 });              // filter by user
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
