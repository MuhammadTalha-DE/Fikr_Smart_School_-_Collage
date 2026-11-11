const mongoose = require('mongoose');

const vehicleGateLogSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, trim: true },
    driverName: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    purpose: { type: String, default: '' },
    direction: {
      type: String,
      enum: ['entry', 'exit'],
      default: 'entry',
    },
    loggedAt: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VehicleGateLog', vehicleGateLogSchema);
