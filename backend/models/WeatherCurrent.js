const mongoose = require('mongoose');

const WeatherCurrentSchema = new mongoose.Schema({
  locationName: { type: String, default: 'Zoormandi, Malakand, KPK' },
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

// TTL index: keep only latest 1 hour of "current" records
WeatherCurrentSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 3600 });
WeatherCurrentSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('WeatherCurrent', WeatherCurrentSchema);
