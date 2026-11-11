const mongoose = require('mongoose');

const WeatherSettingSchema = new mongoose.Schema({
  locationName: { type: String, default: 'Zoormandi, Malakand, KPK' },
  latitude: { type: Number, default: 34.6342 },
  longitude: { type: Number, default: 71.8440 },
  refreshIntervalMinutes: { type: Number, default: 10 },
  autoAlertsEnabled: { type: Boolean, default: true },
  thresholds: {
    highTemperature: { type: Number, default: 38 },
    heavyRain: { type: Number, default: 10 },
    poorAQI: { type: Number, default: 150 },
    strongWind: { type: Number, default: 30 },
    lowVisibility: { type: Number, default: 3 },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Singleton pattern: there should be only one settings document
WeatherSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('WeatherSetting', WeatherSettingSchema);
