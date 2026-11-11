const mongoose = require('mongoose');

const ledgerAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['asset', 'liability', 'equity', 'income', 'expense'],
      required: true,
    },
    category: { type: String, trim: true, default: '' },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    bookType: {
      type: String,
      enum: ['cash', 'bank', 'general', 'internal'],
      default: 'general',
    },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isSystemGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LedgerAccount', ledgerAccountSchema);
