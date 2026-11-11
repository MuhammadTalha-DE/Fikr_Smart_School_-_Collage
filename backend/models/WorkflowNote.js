const mongoose = require('mongoose');

const workflowNoteSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: [
        'purchase_request',
        'hostel_application',
        'hostel_leave',
        'student_gate_pass',
        'staff_gate_pass',
        'medical_escalation',
        'ptm_meeting',
        'student_intervention',
        'health_incident',
        'hostel_visitor',
      ],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      enum: ['admin', 'teacher', 'parent', 'warden', 'librarian', 'transport', 'driver'],
      required: true,
    },
    actionType: {
      type: String,
      enum: ['approve', 'reject', 'confirm', 'decline', 'recommend', 'concern', 'note', 'follow_up'],
      default: 'note',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['internal', 'shared'],
      default: 'shared',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

workflowNoteSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkflowNote', workflowNoteSchema);
