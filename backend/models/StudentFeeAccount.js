const mongoose = require('mongoose');

const studentFeeAccountSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null
  },
  classFeePlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassFeePlan' },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'unpaid'],
    default: 'unpaid',
  },
}, { timestamps: true });

module.exports = mongoose.model('StudentFeeAccount', studentFeeAccountSchema);