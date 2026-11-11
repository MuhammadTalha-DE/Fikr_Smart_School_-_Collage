const AcademicEvent = require('../models/AcademicEvent');
const AcademicDeadline = require('../models/AcademicDeadline');
const AcademicSession = require('../models/AcademicSession');

const SCHEDULE_EFFECT_PRIORITY = {
  cancel: 4,
  override: 3,
  shorten: 2,
  none: 1,
};

const getDayBounds = (value) => {
  const date = value ? new Date(value) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { date, start, end };
};

const normalizeId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const resolveSessionId = async ({ sessionId, academicYear, date } = {}) => {
  if (sessionId) return sessionId;

  const filter = {};
  if (academicYear) filter.name = academicYear;
  if (date) {
    const { start } = getDayBounds(date);
    filter.startDate = { $lte: start };
    filter.endDate = { $gte: start };
  }

  if (Object.keys(filter).length === 0) return null;

  const session = await AcademicSession.findOne(filter).select('_id').lean();
  return session?._id || null;
};

const getEventScheduleEffect = (event) => {
  if (!event?.affectsTimetable) return 'none';
  if (event.scheduleEffect) return event.scheduleEffect;
  if (event.eventType === 'holiday') return 'cancel';
  if (event.eventType === 'exam') return 'override';
  return 'none';
};

const getEventScheduleTypeOverride = (event) => {
  if (!event?.affectsTimetable) return null;
  if (event.scheduleTypeOverride) return event.scheduleTypeOverride;
  if (event.eventType === 'exam') return 'exam';
  return null;
};

const sortTimetableEvents = (left, right) => {
  const leftEffect = getEventScheduleEffect(left);
  const rightEffect = getEventScheduleEffect(right);
  const leftClassSpecific = normalizeId(left.targetClass) ? 1 : 0;
  const rightClassSpecific = normalizeId(right.targetClass) ? 1 : 0;

  return rightClassSpecific - leftClassSpecific
    || SCHEDULE_EFFECT_PRIORITY[rightEffect] - SCHEDULE_EFFECT_PRIORITY[leftEffect]
    || new Date(right.startDate) - new Date(left.startDate);
};

const getAffectingEvents = async (date, options = {}) => {
  const { start, end } = getDayBounds(date);
  const { classId, academicYear } = options;
  const sessionId = await resolveSessionId({ ...options, date: start });

  const filter = {
    affectsTimetable: true,
    startDate: { $lte: end },
    endDate: { $gte: start },
  };

  if (sessionId) filter.session = sessionId;
  if (classId) {
    filter.$or = [
      { targetClass: null },
      { targetClass: { $exists: false } },
      { targetClass: classId },
    ];
  } else {
    filter.$or = [
      { targetClass: null },
      { targetClass: { $exists: false } },
    ];
  }

  if (!sessionId && academicYear) {
    const session = await AcademicSession.findOne({ name: academicYear }).select('_id').lean();
    if (session?._id) filter.session = session._id;
  }

  const events = await AcademicEvent.find(filter)
    .populate('session', 'name')
    .populate('targetClass', 'name')
    .lean();

  return events.sort(sortTimetableEvents);
};

const getTimetableModifiers = async (date, options = {}) => {
  const events = await getAffectingEvents(date, options);
  const modifiers = events
    .map((event) => ({
      _id: event._id,
      title: event.title,
      eventType: event.eventType,
      targetClass: event.targetClass,
      scheduleEffect: getEventScheduleEffect(event),
      scheduleTypeOverride: getEventScheduleTypeOverride(event),
      activePeriods: event.activePeriods || [],
      cancelledPeriods: event.cancelledPeriods || [],
      timetableNote: event.timetableNote || event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
    }))
    .filter((modifier) => modifier.scheduleEffect !== 'none');

  const cancel = modifiers.find((modifier) => modifier.scheduleEffect === 'cancel') || null;
  const override = modifiers.find((modifier) => (
    modifier.scheduleEffect === 'override' && modifier.scheduleTypeOverride
  )) || null;
  const shorten = modifiers.find((modifier) => modifier.scheduleEffect === 'shorten') || null;

  const cancelledPeriods = [
    ...new Set(modifiers.flatMap((modifier) => modifier.cancelledPeriods || []).map(Number).filter(Boolean)),
  ];

  return {
    events,
    modifiers,
    isCancelled: Boolean(cancel),
    cancellationEvent: cancel,
    scheduleTypeOverride: override?.scheduleTypeOverride || null,
    overrideEvent: override,
    activePeriods: shorten?.activePeriods?.map(Number).filter(Boolean) || [],
    shortenEvent: shorten,
    cancelledPeriods,
  };
};

const isHoliday = async (date, options = {}) => {
  const modifiers = await getTimetableModifiers(date, options);
  return modifiers.isCancelled;
};

const getHolidays = async (start, end, options = {}) => {
  const filter = {
    eventType: 'holiday',
    startDate: { $lte: new Date(end) },
    endDate: { $gte: new Date(start) },
  };
  const sessionId = await resolveSessionId(options);
  if (sessionId) filter.session = sessionId;

  return AcademicEvent.find(filter)
    .populate('session', 'name')
    .populate('targetClass', 'name')
    .sort({ startDate: 1 });
};

const getUpcomingDeadlines = async (classId, daysAhead = 7) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + Number(daysAhead || 7));

  const filter = {
    dueDate: { $gte: now, $lte: future },
  };

  if (classId) {
    filter.$or = [
      { targetClass: null },
      { targetClass: { $exists: false } },
      { targetClass: classId },
    ];
  }

  return AcademicDeadline.find(filter)
    .populate('targetClass', 'name')
    .populate('session', 'name')
    .sort({ dueDate: 1 });
};

module.exports = {
  getDayBounds,
  getAffectingEvents,
  getTimetableModifiers,
  isHoliday,
  getHolidays,
  getUpcomingDeadlines,
};
