const mongoose = require('mongoose');

const incidentReportSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'bullying',
        'injury',
        'transport',
        'hostel',
        'theft',
        'fire',
        'medical',
        'discipline',
        'safety_hazard',
        'other',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'dismissed'],
      default: 'reported',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'warden', 'admin', 'librarian', 'transport_staff'],
      required: true,
    },
    involvedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    location: {
      type: String,
      default: '',
    },
    evidence: [
      {
        url: String,
        type: { type: String, enum: ['image', 'document', 'other'] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    resolutionNotes: String,
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

incidentReportSchema.index({ status: 1, createdAt: -1 });
incidentReportSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
