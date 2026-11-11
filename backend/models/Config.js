const mongoose = require('mongoose');

const configSchema = mongoose.Schema({
  key: { type: String, required: true, unique: true },   // e.g. "default_weekly_load"
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);