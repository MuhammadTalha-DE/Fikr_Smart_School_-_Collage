const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',                  // primary parent/guardian (still used)
    default: null,
  },
  // ── NEW FIELDS ──────────────────────────────
  admissionNumber: {
    type: String,
    unique: true,
    sparse: true,                   // allows null values without violating unique constraint
  },
  admissionDate: Date,
  dateOfBirth: Date,
  cnic: String,
  formBNumber: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  bloodGroup: String,
  address: String,
  medicalNotes: String,
  previousSchool: String,
  documents: [String],              // array of file URLs (e.g., birth certificate, transfer certificate)
  rollNumber: String,               // if you didn't already have it
  // ────────────────────────────────────────────
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
