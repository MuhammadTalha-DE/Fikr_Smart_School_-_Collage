const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    credits: { type: Number, default: 0, min: [0, 'Credits must be zero or greater'] },
    type: { type: String, enum: ['Theory', 'Practical', 'Both'], default: 'Theory' },
    category: { type: String, enum: ['Core', 'Elective', 'Optional'], default: 'Core' },
    department: { type: String, trim: true },          // simple department name (or ObjectId later)
    description: { type: String, default: '' },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
