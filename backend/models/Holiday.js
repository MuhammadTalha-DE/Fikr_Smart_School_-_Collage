const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },     // e.g., "Independence Day" every year
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);