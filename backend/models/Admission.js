const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    // Student Information (temporary until enrolled)
    studentName: { type: String, required: true },
    email: { type: String },
    phone: String,
    cnic: String,
    formBNumber: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
    address: String,
    religion: String,
country: String,
province: String,
section: String,
overallBehaviour: { type: String, default: 'Good' },
    previousSchool: String,
    intendedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    // Guardians (embedded; will be transformed into Guardian docs on acceptance)
    guardians: [
      {
        name: { type: String, required: true },
        relation: String,
        phone: String,
        email: String,
        occupation: String,
        address: String,
      },
    ],
    // Documents (URLs after upload)
    documents: [String],
    // Application metadata
    applicationDate: { type: Date, default: Date.now },
    applicationStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    remarks: String,
    // Once accepted, store the created user & student IDs for reference
    createdUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  },
  { timestamps: true }
);

admissionSchema.index({ applicationStatus: 1 });
admissionSchema.index({ intendedClass: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
