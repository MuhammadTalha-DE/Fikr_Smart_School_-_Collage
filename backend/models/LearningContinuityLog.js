const mongoose = require('mongoose');

const learningContinuityLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    deliveryMode: {
      type: String,
      enum: ['in_person', 'hybrid', 'remote', 'cancelled'],
      default: 'in_person',
    },
    source: {
      type: String,
      enum: ['assignment', 'lesson_plan', 'lesson_completion', 'submission', 'manual'],
      default: 'manual',
    },
    assignmentsPublished: {
      type: Number,
      default: 0,
    },
    lessonPlansPrepared: {
      type: Number,
      default: 0,
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
    },
    submissionsReceived: {
      type: Number,
      default: 0,
    },
    resourcesShared: {
      type: Number,
      default: 0,
    },
    liveSessionsScheduled: {
      type: Number,
      default: 0,
    },
    triggeredByWeather: {
      type: Boolean,
      default: false,
    },
    continuityScore: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

learningContinuityLogSchema.index(
  { date: 1, teacher: 1, class: 1, subject: 1, source: 1 },
  { unique: true }
);

module.exports = mongoose.model('LearningContinuityLog', learningContinuityLogSchema);
