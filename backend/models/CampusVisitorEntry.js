const mongoose = require('mongoose');

const campusVisitorEntrySchema = new mongoose.Schema(
  {
    visitorName: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    idNumber: { type: String, default: '' },
    purpose: { type: String, required: true },
    hostName: { type: String, default: '' },
    destination: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'denied'],
      default: 'checked_in',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampusVisitorEntry', campusVisitorEntrySchema);
