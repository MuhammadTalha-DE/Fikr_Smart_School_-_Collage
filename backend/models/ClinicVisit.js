const mongoose = require('mongoose');

const clinicVisitSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    visitDate: { type: Date, default: Date.now },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, default: '' },
    treatment: { type: String, default: '' },
    disposition: {
      type: String,
      enum: ['returned_to_class', 'sent_home', 'referred_hospital', 'hostel_rest'],
      default: 'returned_to_class',
    },
    parentAlerted: { type: Boolean, default: false },
    vitalSigns: {
      temperature: { type: String, default: '' },
      bloodPressure: { type: String, default: '' },
      pulse: { type: String, default: '' },
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicVisit', clinicVisitSchema);
