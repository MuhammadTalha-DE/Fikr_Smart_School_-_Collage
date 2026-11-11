const mongoose = require('mongoose');

const medicalProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    bloodGroup: { type: String, default: '' },
    allergies: [{ type: String, trim: true }],
    conditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    emergencyNotes: { type: String, default: '' },
    primaryDoctor: { type: String, default: '' },
    parentConsent: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalProfile', medicalProfileSchema);
