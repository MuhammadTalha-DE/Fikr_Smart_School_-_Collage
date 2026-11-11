const mongoose = require('mongoose');

const feeItemSchema = new mongoose.Schema({
  feeHeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeHead', required: true },
  amount: { type: Number, required: true },
});

const classFeePlanSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, unique: true },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null
  },
  feeItems: [feeItemSchema],
  frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
  instalmentCount: { type: Number, default: 12 },
  dueDay: { type: Number, default: 10 },   // day of month
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

module.exports = mongoose.model('ClassFeePlan', classFeePlanSchema);