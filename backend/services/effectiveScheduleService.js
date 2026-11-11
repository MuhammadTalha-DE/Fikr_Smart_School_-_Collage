const calendarService = require('./calendarService');

const toId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const normalizePeriodSet = (periods = []) => new Set(
  periods.map((period) => Number(period)).filter(Boolean)
);

const getCalendarEffectSummary = (modifiers) => modifiers.map((modifier) => ({
  eventId: modifier._id,
  title: modifier.title,
  eventType: modifier.eventType,
  scheduleEffect: modifier.scheduleEffect,
  scheduleTypeOverride: modifier.scheduleTypeOverride,
  activePeriods: modifier.activePeriods,
  cancelledPeriods: modifier.cancelledPeriods,
  note: modifier.timetableNote,
}));

const applyCalendarEffectsToTimetable = async (timetable, date, options = {}) => {
  if (!timetable || !date) return timetable;

  const classId = options.classId || toId(timetable.classId);
  const modifiers = await calendarService.getTimetableModifiers(date, {
    classId,
    academicYear: options.academicYear || timetable.academicYear,
    sessionId: options.sessionId,
  });

  if (modifiers.modifiers.length === 0) {
    return {
      ...timetable,
      effectiveSchedule: {
        isCancelled: false,
        calendarEffects: [],
      },
    };
  }

  const calendarEffects = getCalendarEffectSummary(modifiers.modifiers);

  if (modifiers.isCancelled) {
    return {
      ...timetable,
      slots: [],
      isCancelled: true,
      cancellationReason: modifiers.cancellationEvent?.title || 'Calendar event',
      effectiveSchedule: {
        isCancelled: true,
        cancellationReason: modifiers.cancellationEvent?.title || 'Calendar event',
        calendarEffects,
      },
    };
  }

  const activePeriods = normalizePeriodSet(modifiers.activePeriods);
  const cancelledPeriods = normalizePeriodSet(modifiers.cancelledPeriods);

  const slots = (timetable.slots || []).filter((slot) => {
    const period = Number(slot.period);
    if (activePeriods.size > 0 && !activePeriods.has(period)) return false;
    if (cancelledPeriods.has(period)) return false;
    return true;
  });

  return {
    ...timetable,
    slots,
    effectiveSchedule: {
      isCancelled: false,
      scheduleTypeOverride: modifiers.scheduleTypeOverride,
      activePeriods: [...activePeriods],
      cancelledPeriods: [...cancelledPeriods],
      calendarEffects,
    },
  };
};

module.exports = {
  applyCalendarEffectsToTimetable,
};
