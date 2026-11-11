const mongoose = require('mongoose');

const WeatherHistorySchema = new mongoose.Schema({
  locationName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  temperature: { type: Number, required: true },
  feelsLike: { type: Number },
  humidity: { type: Number },
  pressure: { type: Number },
  windSpeed: { type: Number },
  windDirection: { type: Number },
  visibility: { type: Number },
  condition: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  cloudCoverage: { type: Number },
  rainfall: { type: Number, default: 0 },
  uvIndex: { type: Number, default: 0 },
  aqi: { type: Number },
  pm25: { type: Number },
  pm10: { type: Number },
  source: { type: String },
  recordedAt: { type: Date, default: Date.now },
});

// Indexes for analytics
WeatherHistorySchema.index({ recordedAt: -1 });
WeatherHistorySchema.index({ recordedAt: -1, temperature: 1 });
WeatherHistorySchema.index({ condition: 1, recordedAt: -1 });

module.exports = mongoose.model('WeatherHistory', WeatherHistorySchema);
