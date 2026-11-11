const mongoose = require('mongoose');

const transportIncidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['delay', 'incident', 'route_change', 'vehicle_issue'],
      default: 'delay',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'notified', 'resolved'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalNote: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    parentNoticeStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'failed'],
      default: 'not_sent',
    },
    parentNoticeSentAt: {
      type: Date,
      default: null,
    },
    audienceCount: {
      type: Number,
      default: 0,
    },
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      default: null,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

transportIncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('TransportIncident', transportIncidentSchema);
