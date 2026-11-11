const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    category: {
      type: String,
      enum: ['general', 'lab', 'hostel', 'library_consumable', 'asset', 'maintenance_supply'],
      default: 'general',
    },
    location: {
      type: String,
      enum: ['main_store', 'lab', 'hostel', 'library', 'admin'],
      default: 'main_store',
    },
    unit: { type: String, trim: true, default: 'pcs' },
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryVendor', default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    maintenanceRequired: { type: Boolean, default: false },
    lastRestockedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ name: 1, location: 1 });
inventoryItemSchema.index({ category: 1, location: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
