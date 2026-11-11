const SpecialSchedule = require('../models/SpecialSchedule');
const Timetable = require('../models/Timetable');
const Substitution = require('../models/Substitution');
const calendarService = require('./calendarService');
const { applyCalendarEffectsToTimetable } = require('./effectiveScheduleService');

const populateTimetableQuery = (query) => query
  .populate('slots.teacherId', 'userId')
  .populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name email' } })
  .populate('slots.roomId', 'name');

const getDayBounds = (value) => {
  const date = value ? new Date(value) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { date, start, end };
};

const getSlotTeacherId = (teacher) => {
  if (!teacher) return null;
  if (teacher._id) return teacher._id.toString();
  return teacher.toString();
};

const validOnDateFilter = (date) => ({
  $and: [
    { $or: [{ validFrom: null }, { validFrom: { $lte: date } }] },
    { $or: [{ validUntil: null }, { validUntil: { $gte: date } }] },
  ],
});

const getActiveScheduleType = async (date, academicYear, options = {}) => {
  const { start, end } = getDayBounds(date);
  const filter = {
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (academicYear) filter.academicYear = academicYear;

  const calendarModifiers = await calendarService.getTimetableModifiers(start, {
    classId: options.classId,
    academicYear,
    sessionId: options.sessionId,
  });
  if (calendarModifiers.scheduleTypeOverride) return calendarModifiers.scheduleTypeOverride;

  const activeSchedule = await SpecialSchedule.findOne(filter).sort({ startDate: -1 });
  return activeSchedule ? activeSchedule.scheduleType : 'regular';
};

const applySubstitutionsToTimetable = async (timetable, date) => {
  if (!timetable || !date) return timetable;

  const { start, end } = getDayBounds(date);
  const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });

  const substitutions = await Substitution.find({
    classId: timetable.classId?._id || timetable.classId,
    date: { $gte: start, $lte: end },
    status: 'assigned',
  })
    .populate('absentTeacherId', 'userId')
    .populate({ path: 'absentTeacherId', populate: { path: 'userId', select: 'name email' } })
    .populate('substituteTeacherId', 'userId')
    .populate({ path: 'substituteTeacherId', populate: { path: 'userId', select: 'name email' } })
    .lean();

  if (substitutions.length === 0) return timetable;

  const slots = (timetable.slots || []).map((slot) => {
    if (slot.day !== dayOfWeek) return slot;

    const match = substitutions.find((substitution) => (
      Number(substitution.period) === Number(slot.period)
      && getSlotTeacherId(slot.teacherId) === substitution.absentTeacherId?._id?.toString()
    ));

    if (!match || !match.substituteTeacherId) return slot;

    return {
      ...slot,
      teacherId: match.substituteTeacherId,
      substitution: {
        _id: match._id,
        absentTeacherId: match.absentTeacherId,
        assignedBy: match.assignedBy,
        date: match.date,
      },
      isSubstitution: true,
    };
  });

  return {
    ...timetable,
    slots,
    effectiveDate: start,
    substitutionsApplied: substitutions.length,
  };
};

const getActiveTimetableForClass = async (classId, term, academicYear, options = {}) => {
  const lookupDate = options.date ? new Date(options.date) : new Date();
  const requestedScheduleType = options.scheduleType
    || await getActiveScheduleType(lookupDate, academicYear, {
      classId,
      sessionId: options.sessionId,
    });

  const baseFilter = { classId, isActive: true };
  if (term) baseFilter.term = term;
  if (academicYear) baseFilter.academicYear = academicYear;
  if (options.status) baseFilter.status = options.status;

  const shouldFilterByDate = Boolean(options.date) || !options.scheduleType;
  const dateFilter = shouldFilterByDate ? validOnDateFilter(lookupDate) : {};
  const sort = { status: -1, updatedAt: -1 };

  const findTimetable = (scheduleType) => populateTimetableQuery(Timetable.findOne({
    ...baseFilter,
    ...dateFilter,
    scheduleType,
  }).sort(sort)).lean();

  let timetable = await findTimetable(requestedScheduleType);

  if (!timetable && requestedScheduleType !== 'regular' && !options.scheduleType) {
    timetable = await findTimetable('regular');
  }

  if (!timetable) return null;

  const timetableWithSubstitutions = options.applySubstitutions === false
    ? timetable
    : await applySubstitutionsToTimetable(timetable, lookupDate);

  if (options.applyCalendarEffects === false) return timetableWithSubstitutions;

  return applyCalendarEffectsToTimetable(timetableWithSubstitutions, lookupDate, {
    classId,
    academicYear,
    sessionId: options.sessionId,
  });
};

module.exports = {
  getActiveScheduleType,
  getActiveTimetableForClass,
  applySubstitutionsToTimetable,
  getDayBounds,
  validOnDateFilter,
};
