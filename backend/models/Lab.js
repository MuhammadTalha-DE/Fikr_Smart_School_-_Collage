const mongoose = require('mongoose');

const labSchema = mongoose.Schema({
  name: { type: String, required: true },          // e.g. "Physics Lab"
  description: String,
  location: String,
  inCharge: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // lab in‑charge
});

module.exports = mongoose.model('Lab', labSchema);