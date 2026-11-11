const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    type: {
      type: String,
      enum: ['manual', 'message', 'announcement', 'system', 'weather', 'safety', 'attendance', 'finance', 'hostel', 'transport', 'library', 'academic'],
      default: 'manual',
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },
    sourceModule: {
      type: String,
      default: 'notification-center',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'queued', 'sent', 'partial', 'failed', 'cancelled'],
      default: 'draft',
    },
    channels: [{
      type: String,
      enum: ['in_app', 'email', 'sms', 'push'],
    }],
    audience: {
      sendToAll: { type: Boolean, default: false },
      roles: [{ type: String }],
      userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    metadata: {
      link: { type: String, default: '' },
      entity: { type: String, default: '' },
      entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
      tags: [{ type: String }],
      context: { type: Object, default: null },
    },
    scheduleFor: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      deliveredRecipients: { type: Number, default: 0 },
      failedRecipients: { type: Number, default: 0 },
      readRecipients: { type: Number, default: 0 },
      channels: {
        in_app: { type: Number, default: 0 },
        email: { type: Number, default: 0 },
        sms: { type: Number, default: 0 },
        push: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, status: 1, createdAt: -1 });
notificationSchema.index({ 'audience.roles': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
