const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'id_card', 'certificate', 'fee_voucher', 'result_card',
      'admit_card', 'official_letter', 'receipt', 'notice',
      'bonafide', 'character', 'leaving', 'transfer', 'migration',
      'experience', 'appointment', 'relieving', 'salary_certificate',
      'no_objection', 'appreciation', 'attendance_certificate',
      'fee_clearance', 'scholarship', 'sports', 'achievement',
      'internship', 'library_card', 'transport_pass', 'hostel_certificate',
      'joining_letter', 'training_certificate', 'duty_certificate',
      'outstanding_notice', 'installment_plan', 'late_fee_notice',
      'monthly_fee_statement', 'annual_fee_statement',
      'transcript', 'marks_sheet', 'merit_certificate',
      'circular', 'announcement', 'discipline_notice',
      'parent_meeting', 'event_certificate', 'enrollment_confirmation',
      'roll_number_slip', 'exam_attendance_sheet'
    ],
  },
  roleTarget: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'parent', 'admin', 'librarian', 'warden', 'transport', 'staff', 'user'],
  },
  layout: {
    width: { type: Number, default: 842 },
    height: { type: Number, default: 595 },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'landscape' },
    margins: {
      top: { type: Number, default: 20 },
      bottom: { type: Number, default: 20 },
      left: { type: Number, default: 20 },
      right: { type: Number, default: 20 },
    },
    backgroundColor: { type: String, default: '#ffffff' },
    borderColor: { type: String, default: '#1e3a8a' },
    borderWidth: { type: Number, default: 2 },
    headerHeight: { type: Number, default: 80 },
    footerHeight: { type: Number, default: 50 },
  },
  content: {
    type: String,
    default: '',
  },
  fields: [{
    key: { type: String },
    label: { type: String },
    type: {
      type: String,
      enum: ['text', 'image', 'qr', 'barcode', 'date', 'signature', 'stamp'],
      default: 'text',
    },
    defaultValue: { type: String },
    required: { type: Boolean, default: false },
    customInput: { type: Boolean, default: false },
    inputType: { type: String, enum: ['text', 'textarea', 'number', 'date', 'select'], default: 'text' },
    options: [{ type: String }],
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number },
    fontSize: { type: Number },
    fontColor: { type: String },
    fontWeight: { type: String },
    textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    placeholder: { type: String },
  }],
  background: {
    type: String,
    default: null,
  },
  watermark: {
    text: { type: String },
    opacity: { type: Number, default: 0.1 },
    fontSize: { type: Number, default: 60 },
    color: { type: String, default: '#cccccc' },
  },
  signature: {
    type: String,
    default: null,
  },
  stamp: {
    type: String,
    default: null,
  },
  headerTemplate: { type: String, default: '' },
  footerTemplate: { type: String, default: '' },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

documentTemplateSchema.index({ type: 1, roleTarget: 1 });
documentTemplateSchema.index({ isActive: 1 });

documentTemplateSchema.pre('validate', function validateCustomInputs() {
  const customFields = (this.fields || []).filter((field) => field.customInput);
  const keys = customFields.map((field) => String(field.key || '').trim());
  customFields.forEach((field, index) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(keys[index])) {
      this.invalidate(`fields.${index}.key`, 'Custom field keys must start with a letter and contain only letters, numbers, and underscores.');
    }
    if (field.inputType === 'select' && !(field.options || []).length) {
      this.invalidate(`fields.${index}.options`, 'Dropdown fields need at least one choice.');
    }
  });
  if (new Set(keys).size !== keys.length) {
    this.invalidate('fields', 'Custom input field keys must be unique within a template.');
  }
});

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
