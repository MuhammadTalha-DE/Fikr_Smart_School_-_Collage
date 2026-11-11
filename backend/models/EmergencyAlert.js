const mongoose = require('mongoose');

const emergencyAlertSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'emergency',
        'weather',
        'transport',
        'hostel',
        'medical',
        'security',
        'fire',
        'natural_disaster',
        'lockdown',
        'other',
      ],
      default: 'emergency',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed'],
      default: 'active',
    },
    targetRoles: {
      type: [String],
      enum: ['all', 'admin', 'teacher', 'student', 'parent', 'warden', 'librarian'],
      default: ['all'],
    },
    targetClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    acknowledgedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: { type: Date, default: Date.now },
      },
    ],
    location: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
