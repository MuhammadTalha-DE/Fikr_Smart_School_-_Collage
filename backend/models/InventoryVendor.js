const mongoose = require('mongoose');

const inventoryVendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'general' },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    leadTimeDays: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

inventoryVendorSchema.index({ name: 1 });

module.exports = mongoose.model('InventoryVendor', inventoryVendorSchema);
