const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const Substitution = require('../models/Substitution');
const TeacherAvailability = require('../models/TeacherAvailability');
const {
  getActiveScheduleType,
  getDayBounds,
  validOnDateFilter,
} = require('./scheduleService');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isAvailableByPreference = async (teacherId, day, period) => {
  const availability = await TeacherAvailability.findOne({ teacherId }).lean();
  if (!availability?.slots?.[day]) return true;
  return availability.slots[day][Number(period) - 1] !== false;
};

const getTeacherDailyLoad = async (teacherId, day, scheduleTypes, date) => {
  const count = await Timetable.aggregate([
    {
      $match: {
        isActive: true,
        scheduleType: { $in: scheduleTypes },
        ...validOnDateFilter(date),
      },
    },
    { $unwind: '$slots' },
    {
      $match: {
        'slots.day': day,
        'slots.teacherId': teacherId,
      },
    },
    { $count: 'count' },
  ]);
  return count[0]?.count || 0;
};

const scoreSubstitute = async ({ teacher, day, period, subject, classId, scheduleTypes, start, end }) => {
  const reasons = [];
  let score = 0;

  if ((teacher.subjects || []).some((item) => item.toLowerCase() === String(subject).toLowerCase())) {
    score += 40;
    reasons.push('Teaches this subject');
  }

  if ((teacher.preferredSubjects || []).some((item) => item.toLowerCase() === String(subject).toLowerCase())) {
    score += 10;
    reasons.push('Prefers this subject');
  }

  if ((teacher.classes || []).some((item) => item.toString() === String(classId))) {
    score += 15;
    reasons.push('Already associated with this class');
  }

  const dailyLoad = await getTeacherDailyLoad(teacher._id, day, scheduleTypes, start);
  score += Math.max(0, 20 - dailyLoad * 4);
  reasons.push(`${dailyLoad} scheduled period(s) that day`);

  const substitutionLoad = await Substitution.countDocuments({
    substituteTeacherId: teacher._id,
    date: { $gte: start, $lte: end },
    status: 'assigned',
  });
  score += Math.max(0, 10 - substitutionLoad * 5);
  if (substitutionLoad === 0) reasons.push('No substitution duty that day');

  if (await isAvailableByPreference(teacher._id, day, period)) {
    score += 15;
    reasons.push('Marked available');
  }

  return {
    ...teacher.toObject(),
    substituteScore: score,
    substituteReasons: reasons,
  };
};

const findSubstitutes = async (slot, excludeTeacherId) => {
  const { day, period, subject, classId, date } = slot;
  const { start, end } = getDayBounds(date);
  const activeScheduleType = await getActiveScheduleType(start);
  const scheduleTypes = activeScheduleType === 'regular'
    ? ['regular']
    : [activeScheduleType, 'regular'];

  const allTeachers = await Teacher.find({
    _id: { $ne: excludeTeacherId },
    subjects: { $regex: new RegExp(`^${escapeRegExp(subject)}$`, 'i') },
  }).populate('userId', 'name email');

  const available = [];
  for (const teacher of allTeachers) {
    const preferredAvailable = await isAvailableByPreference(teacher._id, day, period);
    if (!preferredAvailable) continue;

    const timetableConflict = await Timetable.findOne({
      'slots': {
        $elemMatch: {
          day,
          period: Number(period),
          teacherId: teacher._id,
        },
      },
      classId: { $ne: classId },
      isActive: true,
      scheduleType: { $in: scheduleTypes },
      ...validOnDateFilter(start),
    });

    if (timetableConflict) continue;

    const substitutionConflict = await Substitution.findOne({
      substituteTeacherId: teacher._id,
      date: { $gte: start, $lte: end },
      period: Number(period),
      status: 'assigned',
    });

    if (!substitutionConflict) {
      available.push(await scoreSubstitute({
        teacher,
        day,
        period,
        subject,
        classId,
        scheduleTypes,
        start,
        end,
      }));
    }
  }

  return available.sort((left, right) => (
    right.substituteScore - left.substituteScore
    || (left.userId?.name || '').localeCompare(right.userId?.name || '')
  ));
};

module.exports = { findSubstitutes };
