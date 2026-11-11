const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedDocument',
    required: true,
  }],
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobType: {
    type: String,
    enum: ['single', 'bulk'],
    default: 'single',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  copies: {
    type: Number,
    default: 1,
  },
  duplexPrint: {
    type: Boolean,
    default: false,
  },
  colorPrint: {
    type: Boolean,
    default: true,
  },
  printerName: {
    type: String,
    default: '',
  },
  completedAt: {
    type: Date,
    default: null,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PrintJob', printJobSchema);
