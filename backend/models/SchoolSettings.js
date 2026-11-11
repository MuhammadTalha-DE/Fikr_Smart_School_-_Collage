const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'Fikr Smart School' },
  logo: { type: String, default: '' },               // Cloudinary URL
  address: { type: String, default: '' },
  principalSignature: { type: String, default: '' }, // NEW
  schoolStamp: { type: String, default: '' },  
       // NEW
}, { timestamps: true });

// Ensure only one settings document exists
schoolSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);