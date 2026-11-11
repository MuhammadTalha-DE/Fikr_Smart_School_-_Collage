const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    studentFeeAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFeeAccount',
      required: true,
      index: true,
    },
    instalment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeInstallment',
      default: null,          // can be null if it's a bulk payment
    },
    amount: { type: Number, required: true },
    mode: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online', 'other'],
      default: 'cash',
    },
    paymentDate: { type: Date, default: Date.now },
    reference: String,        // cheque number, transaction ID, etc.
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);