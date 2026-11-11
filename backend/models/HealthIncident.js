const mongoose = require('mongoose');

const healthIncidentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    incidentType: {
      type: String,
      enum: ['clinic', 'hostel', 'sports', 'weather', 'emergency'],
      default: 'clinic',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    details: { type: String, required: true },
    actionTaken: { type: String, default: '' },
    parentAlerted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['open', 'monitoring', 'resolved'],
      default: 'open',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthIncident', healthIncidentSchema);
