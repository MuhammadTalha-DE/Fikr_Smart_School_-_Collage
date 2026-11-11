const mongoose = require('mongoose');

const channelResultSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'skipped'],
    default: 'pending',
  },
  deliveredAt: { type: Date, default: null },
  error: { type: String, default: '' },
}, { _id: false });

const notificationReceiptSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      default: 'member',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'partial', 'failed', 'skipped'],
      default: 'pending',
    },
    channelResults: {
      type: [channelResultSchema],
      default: [],
    },
  },
  { timestamps: true }
);

notificationReceiptSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationReceiptSchema.index({ notification: 1, deliveryStatus: 1 });
notificationReceiptSchema.index({ notification: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('NotificationReceipt', notificationReceiptSchema);
