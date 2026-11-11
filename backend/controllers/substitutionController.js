const Substitution = require('../models/Substitution');
const Timetable = require('../models/Timetable');
const { findSubstitutes } = require('../services/substitutionService');
const {
  getActiveScheduleType,
  getDayBounds,
  validOnDateFilter,
} = require('../services/scheduleService');
const asyncHandler = require('express-async-handler');
const realtimeService = require('../services/realtimeService');
const auditService = require('../services/auditService');
const { notifySubstitutionChange } = require('../services/scheduleNotificationService');

const getTeacherId = (teacher) => {
  if (!teacher) return null;
  if (teacher._id) return teacher._id.toString();
  return teacher.toString();
};

const getScheduleAwareTimetables = async ({ date, academicYear, status }) => {
  const { start } = getDayBounds(date);
  const activeScheduleType = await getActiveScheduleType(start, academicYear);
  const scheduleTypes = activeScheduleType === 'regular'
    ? ['regular']
    : [activeScheduleType, 'regular'];

  const filter = {
    isActive: true,
    scheduleType: { $in: scheduleTypes },
    ...validOnDateFilter(start),
  };
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;

  const timetables = await Timetable.find(filter)
    .populate('classId', 'name')
    .populate('slots.teacherId', 'userId')
    .populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } })
    .sort({ scheduleType: activeScheduleType === 'regular' ? 1 : -1, updatedAt: -1 })
    .lean();

  const byClass = new Map();
  for (const timetable of timetables) {
    const classId = timetable.classId?._id?.toString() || timetable.classId?.toString();
    if (!classId) continue;
    const existing = byClass.get(classId);
    const shouldReplace = !existing
      || (timetable.scheduleType === activeScheduleType && existing.scheduleType !== activeScheduleType);
    if (shouldReplace) byClass.set(classId, timetable);
  }

  return Array.from(byClass.values());
};

const getAffectedSlots = asyncHandler(async (req, res) => {
  const { teacherId, date, academicYear, status } = req.query;
  if (!teacherId || !date) throw new Error('teacherId and date are required');

  const { start, end } = getDayBounds(date);
  const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });

  const timetables = await getScheduleAwareTimetables({ date: start, academicYear, status });
  const existingSubstitutions = await Substitution.find({
    absentTeacherId: teacherId,
    date: { $gte: start, $lte: end },
    status: 'assigned',
  }).lean();

  const assignedKeys = new Set(existingSubstitutions.map((substitution) => (
    `${substitution.classId.toString()}-${Number(substitution.period)}`
  )));

  const slots = [];
  for (const timetable of timetables) {
    const classId = timetable.classId?._id?.toString() || timetable.classId?.toString();
    const affected = (timetable.slots || []).filter((slot) => (
      slot.day === dayOfWeek
      && getTeacherId(slot.teacherId) === teacherId
      && !assignedKeys.has(`${classId}-${Number(slot.period)}`)
    ));

    for (const slot of affected) {
      slots.push({
        timetableId: timetable._id,
        classId: timetable.classId,
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        scheduleType: timetable.scheduleType,
      });
    }
  }

  res.json(slots);
});

const getEligibleSubstitutes = asyncHandler(async (req, res) => {
  const { teacherId, day, period, subject, classId, date } = req.query;
  const subs = await findSubstitutes({ day, period, subject, classId, date }, teacherId);
  res.json(subs);
});

const assignSubstitute = asyncHandler(async (req, res) => {
  const {
    absentTeacherId,
    timetableId = null,
    date,
    period,
    subject,
    classId,
    substituteTeacherId,
  } = req.body;
  const { start } = getDayBounds(date);

  const substitution = await Substitution.findOneAndUpdate(
    {
      absentTeacherId,
      date: start,
      period: Number(period),
      classId,
    },
    {
      absentTeacherId,
      timetableId,
      date: start,
      period: Number(period),
      subject,
      classId,
      substituteTeacherId,
      assignedBy: req.user._id,
      status: 'assigned',
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate('absentTeacherId', 'userId')
    .populate({ path: 'absentTeacherId', populate: { path: 'userId', select: 'name' } })
    .populate('substituteTeacherId', 'userId')
    .populate({ path: 'substituteTeacherId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name');

  realtimeService.emitTimetableUpdated({
    timetableId,
    classId,
    status: 'substitution_assigned',
    term: null,
    academicYear: null,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });

  auditService.log({
    action: 'UPSERT',
    entity: 'Substitution',
    entityId: substitution._id,
    module: 'scheduling',
    description: `Substitution assigned for ${substitution.classId?.name || 'class'} P${substitution.period}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: {
      after: {
        absentTeacherId,
        substituteTeacherId,
        classId,
        date: start,
        period: Number(period),
        subject,
      },
    },
    req,
  });

  await notifySubstitutionChange({
    substitution,
    actor: req.user,
    req,
  });

  res.status(201).json({ message: 'Substitute assigned', substitution });
});

const getSubstitutions = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) {
    const { start, end } = getDayBounds(date);
    filter.date = { $gte: start, $lte: end };
  }

  const subs = await Substitution.find(filter)
    .populate('absentTeacherId', 'userId')
    .populate({ path: 'absentTeacherId', populate: { path: 'userId', select: 'name' } })
    .populate('substituteTeacherId', 'userId')
    .populate({ path: 'substituteTeacherId', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name')
    .sort('-date');
  res.json(subs);
});

module.exports = {
  getAffectedSlots,
  getEligibleSubstitutes,
  assignSubstitute,
  getSubstitutions,
};
