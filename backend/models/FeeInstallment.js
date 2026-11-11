const mongoose = require('mongoose');

const feeInstalmentSchema = new mongoose.Schema({
  studentFeeAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFeeAccount', required: true },
  instalmentNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  paidDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('FeeInstallment', feeInstalmentSchema);