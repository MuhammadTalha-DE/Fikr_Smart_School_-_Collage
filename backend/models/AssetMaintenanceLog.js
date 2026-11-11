const mongoose = require('mongoose');

const assetMaintenanceLogSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    issueType: { type: String, trim: true, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToName: { type: String, trim: true, default: '' },
    scheduledDate: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

assetMaintenanceLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AssetMaintenanceLog', assetMaintenanceLogSchema);
