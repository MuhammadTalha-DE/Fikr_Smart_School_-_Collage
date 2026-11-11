const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    categories: {
      weather: { type: Boolean, default: true },
      safety: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      finance: { type: Boolean, default: true },
      hostel: { type: Boolean, default: true },
      transport: { type: Boolean, default: true },
      library: { type: Boolean, default: true },
      academic: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      manual: { type: Boolean, default: true },
      message: { type: Boolean, default: true },
      announcement: { type: Boolean, default: true },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '06:00' },
    },
  },
  { timestamps: true }
);

notificationPreferenceSchema.statics.getOrCreateForUser = async function getOrCreateForUser(userId) {
  let prefs = await this.findOne({ user: userId });
  if (!prefs) {
    prefs = await this.create({ user: userId });
  }
  return prefs;
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
