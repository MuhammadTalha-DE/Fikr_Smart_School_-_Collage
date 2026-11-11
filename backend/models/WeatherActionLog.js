const mongoose = require('mongoose');

const WeatherActionLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

WeatherActionLogSchema.index({ createdAt: -1 });
WeatherActionLogSchema.index({ action: 1 });

module.exports = mongoose.model('WeatherActionLog', WeatherActionLogSchema);
