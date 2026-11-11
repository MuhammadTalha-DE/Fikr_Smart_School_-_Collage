const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  relation: String,            // e.g., Father, Mother, Legal Guardian
  phone: String,
  email: String,
  occupation: String,
  address: String,
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Guardian', guardianSchema);