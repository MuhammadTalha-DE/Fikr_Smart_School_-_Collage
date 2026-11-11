const mongoose = require('mongoose');

const medicineLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    clinicVisitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicVisit',
      default: null,
    },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    administeredAt: { type: Date, default: Date.now },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicineLog', medicineLogSchema);
