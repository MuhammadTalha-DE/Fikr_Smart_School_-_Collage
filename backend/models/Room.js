const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, default: 30 },
  type: { type: String, enum: ['Classroom', 'Lab', 'Hall', 'Library', 'Other'], default: 'Classroom' },
  location: String,
  // Optional: store availability as a flat map later
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);