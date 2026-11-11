const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stops: [
    {
      location: { type: String, required: true },
      order: { type: Number, required: true },
      distanceFromStart: { type: Number, default: 0 },   // km
    },
  ],
  totalDistance: { type: Number, default: 0 },            // km
  estimatedTime: { type: Number, default: 0 },            // minutes
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);