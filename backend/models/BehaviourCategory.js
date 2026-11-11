const mongoose = require('mongoose');

const behaviourCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },        // e.g., "bullying"
  label: { type: String, required: true },                     // e.g., "Bullying"
  type: { type: String, enum: ['positive', 'negative'], required: true },
  severity: { type: String, enum: ['minor', 'moderate', 'serious'], default: 'moderate' },
  defaultPoints: { type: Number, default: 0 },                 // e.g., -10
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('BehaviourCategory', behaviourCategorySchema);