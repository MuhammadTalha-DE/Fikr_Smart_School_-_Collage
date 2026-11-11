const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetRoles: {
    type: [String],
    enum: ['all', 'teacher', 'student', 'parent'],
    default: ['all'],
  },
  targetClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);