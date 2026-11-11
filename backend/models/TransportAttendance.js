const mongoose = require('mongoose');

const transportAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    tripType: {
      type: String,
      enum: ['morning_pickup', 'evening_drop', 'both'],
      default: 'both',
    },
    boarded: {
      type: Boolean,
      default: false,
    },
    dropped: {
      type: Boolean,
      default: false,
    },
    boardedTime: Date,
    droppedTime: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
  },
  { timestamps: true }
);

transportAttendanceSchema.index({ studentId: 1, date: 1, tripType: 1 }, { unique: true });

module.exports = mongoose.model('TransportAttendance', transportAttendanceSchema);
