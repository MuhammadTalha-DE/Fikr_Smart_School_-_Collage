const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: {
      type: String,
      enum: ['issue', 'return', 'receive', 'consume', 'adjustment', 'maintenance'],
      required: true,
    },
    area: {
      type: String,
      enum: ['main_store', 'lab', 'hostel', 'library', 'admin'],
      default: 'main_store',
    },
    quantity: { type: Number, required: true, min: 1 },
    issuedTo: { type: String, trim: true, default: '' },
    referenceType: { type: String, trim: true, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
