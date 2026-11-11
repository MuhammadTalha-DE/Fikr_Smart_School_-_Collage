const mongoose = require('mongoose');

const emergencyContactSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    relationship: {
      type: String,
      enum: ['guardian', 'ambulance', 'police', 'fire', 'hospital', 'school_staff', 'other'],
      required: true,
    },
    phone: { type: String, required: true },
    alternatePhone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
