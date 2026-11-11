const mongoose = require('mongoose');

const AcademicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      example: '2025-2026',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    terms: [
      {
        name: { type: String, required: true },  // e.g., 'First Term'
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Keep calendar ranges valid for both session documents and nested terms.
AcademicSessionSchema.pre('validate', function validateDateRanges() {
  const sessionStart = this.startDate?.getTime();
  const sessionEnd = this.endDate?.getTime();

  if (Number.isFinite(sessionStart) && Number.isFinite(sessionEnd) && sessionEnd < sessionStart) {
    this.invalidate('endDate', 'Session end date must be on or after its start date.');
  }

  (this.terms || []).forEach((term, index) => {
    const termStart = term.startDate?.getTime();
    const termEnd = term.endDate?.getTime();

    if (Number.isFinite(termStart) && Number.isFinite(termEnd) && termEnd < termStart) {
      this.invalidate(`terms.${index}.endDate`, 'Term end date must be on or after its start date.');
    }

    if (Number.isFinite(termStart) && Number.isFinite(sessionStart) && termStart < sessionStart) {
      this.invalidate(`terms.${index}.startDate`, 'Term dates must fall within the academic session.');
    }
    if (Number.isFinite(termEnd) && Number.isFinite(sessionEnd) && termEnd > sessionEnd) {
      this.invalidate(`terms.${index}.endDate`, 'Term dates must fall within the academic session.');
    }
  });
});

module.exports = mongoose.model('AcademicSession', AcademicSessionSchema);
