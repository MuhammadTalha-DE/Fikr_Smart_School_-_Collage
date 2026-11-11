const mongoose = require('mongoose');

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', default: null },
    itemName: { type: String, trim: true, required: true },
    quantity: { type: Number, required: true, min: 1 },
    estimatedUnitCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: 'general' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'ordered'],
      default: 'pending',
    },
    justification: { type: String, trim: true, default: '' },
    neededBy: { type: Date, default: null },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryVendor', default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [purchaseRequestItemSchema], default: [] },
    totalEstimatedCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
