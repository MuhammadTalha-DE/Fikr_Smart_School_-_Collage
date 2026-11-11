const LearningContinuityLog = require('../models/LearningContinuityLog');
const learningContinuityService = require('../services/learningContinuityService');

exports.getContinuitySummary = async (req, res) => {
  try {
    const days = Number(req.query.days || 30);
    const summary = await learningContinuityService.getSummary(days);
    res.json({ success: true, data: summary });
  } catch (error) {
    throw error;
  }
};

exports.getContinuityLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const logs = await LearningContinuityLog.find(filter)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: logs });
  } catch (error) {
    throw error;
  }
};

exports.createContinuityLog = async (req, res) => {
  try {
    const log = await learningContinuityService.recordEvent({
      date: req.body.date,
      teacher: req.body.teacher || null,
      classId: req.body.class || null,
      subject: req.body.subject || null,
      source: req.body.source || 'manual',
      increments: {
        assignmentsPublished: req.body.assignmentsPublished || 0,
        lessonPlansPrepared: req.body.lessonPlansPrepared || 0,
        lessonsCompleted: req.body.lessonsCompleted || 0,
        submissionsReceived: req.body.submissionsReceived || 0,
        resourcesShared: req.body.resourcesShared || 0,
        liveSessionsScheduled: req.body.liveSessionsScheduled || 0,
      },
      setFields: {
        deliveryMode: req.body.deliveryMode,
        triggeredByWeather: req.body.triggeredByWeather,
      },
      notes: req.body.notes || '',
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

