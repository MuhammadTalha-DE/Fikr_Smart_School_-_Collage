const mongoose = require('mongoose');

const dayEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  breakfast: { type: String, default: '' },
  lunch:     { type: String, default: '' },
  dinner:    { type: String, default: '' },
}, { _id: false });

const messMenuSchema = new mongoose.Schema({
  weekStart: {
    type: Date,
    required: true,
    unique: true,   // one menu per week
  },
  days: [dayEntrySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);