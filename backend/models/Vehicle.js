const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  driverName: { type: String, default: '' },
  driverContact: { type: String, default: '' },
  busType: { type: String, default: 'School Bus' },
  insuranceExpiry: Date,
  fitnessExpiry: Date,
  isActive: { type: Boolean, default: true },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    lastUpdated: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);