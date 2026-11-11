const mongoose = require('mongoose');
const concessionSchema = new mongoose.Schema({
  studentFeeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFeeAccount', required: true },
  amount: { type: Number, required: true },
  reason: String,
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Concession', concessionSchema);