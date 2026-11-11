const mongoose = require('mongoose');

const securityNoticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    noticeType: {
      type: String,
      enum: ['security', 'lockdown', 'visitor', 'emergency'],
      default: 'security',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    audience: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'active', 'resolved'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecurityNotice', securityNoticeSchema);
