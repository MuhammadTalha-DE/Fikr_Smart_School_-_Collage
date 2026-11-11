// models/CertificateTemplate.js
const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "Bonafide Certificate"
  type: { type: String, required: true, unique: true }, // bonafide, character, leaving
  content: { type: String, required: true },     // HTML template with placeholders {{studentName}}
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);