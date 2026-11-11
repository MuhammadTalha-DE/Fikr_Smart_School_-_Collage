const AcademicSession = require('../models/AcademicSession');
const AcademicEvent = require('../models/AcademicEvent');
const AcademicDeadline = require('../models/AcademicDeadline');
const calendarService = require('../services/calendarService');

// ---------- Sessions ----------
exports.createSession = async (req, res) => {
  try {
    const session = await AcademicSession.create(req.body);
    if (session.isActive) {
      await AcademicSession.updateMany(
        { _id: { $ne: session._id } },
        { isActive: false }
      );
    }
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSessions = async (req, res) => {
  const sessions = await AcademicSession.find().sort({ startDate: -1 });
  res.json({ success: true, sessions });
};

exports.updateSession = async (req, res) => {
  try {
    const session = await AcademicSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Save the document so cross-field date validation runs on updates too.
    ['name', 'startDate', 'endDate', 'terms', 'isActive'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) session[field] = req.body[field];
    });
    await session.save();

    if (session.isActive) {
      await AcademicSession.updateMany(
        { _id: { $ne: session._id } },
        { isActive: false }
      );
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  const session = await AcademicSession.findByIdAndDelete(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ success: true, message: 'Session deleted' });
};

// ---------- Events ----------
exports.createEvent = async (req, res) => {
  try {
    const event = await AcademicEvent.create(req.body);
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  const filter = {};
  if (req.query.session) filter.session = req.query.session;
  if (req.query.type) filter.eventType = req.query.type;
  if (req.query.class) filter.targetClass = req.query.class;
  const events = await AcademicEvent.find(filter)
    .populate('session', 'name')
    .populate('targetClass', 'name')
    .sort({ startDate: 1 });
  res.json({ success: true, events });
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await AcademicEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  await AcademicEvent.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Event deleted' });
};

// ---------- Deadlines ----------
exports.createDeadline = async (req, res) => {
  try {
    const deadline = await AcademicDeadline.create(req.body);
    res.status(201).json({ success: true, deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeadlines = async (req, res) => {
  const filter = {};
  if (req.query.session) filter.session = req.query.session;
  if (req.query.class) filter.targetClass = req.query.class;
  if (req.query.type) filter.deadlineType = req.query.type;
  const deadlines = await AcademicDeadline.find(filter)
    .populate('session', 'name')
    .populate('targetClass', 'name')
    .sort({ dueDate: 1 });
  res.json({ success: true, deadlines });
};

exports.updateDeadline = async (req, res) => {
  try {
    const deadline = await AcademicDeadline.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteDeadline = async (req, res) => {
  await AcademicDeadline.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deadline deleted' });
};

// ---------- Combined Calendar Feed ----------
exports.getCalendarData = async (req, res) => {
  try {
    const { start, end } = req.query;
    const sessionId = req.query.session;

    const eventFilter = {};
    if (start && end) {
      eventFilter.startDate = { $lte: new Date(end) };
      eventFilter.endDate = { $gte: new Date(start) };
    }
    if (sessionId) eventFilter.session = sessionId;

    const events = await AcademicEvent.find(eventFilter)
      .populate('session', 'name')
      .lean();

    const deadlineFilter = {};
    if (start && end) {
      deadlineFilter.dueDate = { $gte: new Date(start), $lte: new Date(end) };
    }
    if (sessionId) deadlineFilter.session = sessionId;

    const deadlines = await AcademicDeadline.find(deadlineFilter)
      .populate('session', 'name')
      .lean();

    res.json({ success: true, events, deadlines });
  } catch (error) {
    throw error;
  }
};
