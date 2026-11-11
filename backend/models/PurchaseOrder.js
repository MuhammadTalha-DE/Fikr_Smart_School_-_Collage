const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', default: null },
    description: { type: String, trim: true, required: true },
    quantity: { type: Number, required: true, min: 1 },
    receivedQuantity: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true, unique: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryVendor', required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest', default: null },
    status: {
      type: String,
      enum: ['draft', 'issued', 'partially_received', 'completed', 'cancelled'],
      default: 'issued',
    },
    items: { type: [purchaseOrderItemSchema], default: [] },
    orderedAt: { type: Date, default: Date.now },
    expectedDelivery: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    totalAmount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ status: 1, orderedAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
