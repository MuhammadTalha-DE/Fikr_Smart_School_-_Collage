const mongoose = require('mongoose');

const budgetPlanSchema = new mongoose.Schema(
  {
    department: { type: String, trim: true, required: true },
    category: { type: String, trim: true, required: true },
    fiscalYear: { type: Number, required: true },
    fiscalMonth: { type: Number, min: 1, max: 12, required: true },
    allocatedAmount: { type: Number, default: 0 },
    committedAmount: { type: Number, default: 0 },
    spentAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'active', 'locked'],
      default: 'active',
    },
    ownerRole: { type: String, trim: true, default: 'admin' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

budgetPlanSchema.index({ fiscalYear: -1, fiscalMonth: -1, department: 1, category: 1 });

module.exports = mongoose.model('BudgetPlan', budgetPlanSchema);
