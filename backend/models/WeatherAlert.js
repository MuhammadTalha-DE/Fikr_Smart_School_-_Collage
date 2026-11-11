const mongoose = require('mongoose');

const WeatherAlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['rain', 'heat', 'fog', 'storm', 'aqi', 'wind', 'manual'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  targetRoles: [{ type: String, enum: ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'] }],
  isActive: { type: Boolean, default: true },
  isAutomatic: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

WeatherAlertSchema.index({ isActive: 1, createdAt: -1 });
WeatherAlertSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model('WeatherAlert', WeatherAlertSchema);
