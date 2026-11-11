const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },              // e.g., "Boys Hostel A"
  type: { type: String, enum: ['boys', 'girls'], required: true },
  capacity: { type: Number, required: true },           // total beds
  wardenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  address: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);