const mongoose = require('mongoose');

const voucherLineSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LedgerAccount',
      required: true,
    },
    description: { type: String, default: '' },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
  },
  { _id: false }
);

const ledgerVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true, trim: true, unique: true },
    voucherType: {
      type: String,
      enum: ['receipt', 'payment', 'journal', 'contra'],
      required: true,
    },
    entryDate: { type: Date, required: true, default: Date.now },
    reference: { type: String, default: '' },
    narration: { type: String, default: '' },
    moduleSource: {
      type: String,
      enum: ['manual', 'fees', 'transport', 'hostel', 'payroll', 'other'],
      default: 'manual',
    },
    book: {
      type: String,
      enum: ['cash', 'bank', 'journal'],
      default: 'journal',
    },
    bankName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'posted', 'void'],
      default: 'posted',
    },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    lines: {
      type: [voucherLineSchema],
      validate: [(value) => Array.isArray(value) && value.length >= 2, 'Voucher must have at least two lines'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LedgerVoucher', ledgerVoucherSchema);
