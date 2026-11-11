const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const TeacherAvailability = require('../models/TeacherAvailability');
const WeeklyLoad = require('../models/WeeklyLoad');
const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const SchoolPeriod = require('../models/SchoolPeriod');
const Subject = require('../models/Subject');
const { getDefaultLoad } = require('./configService');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FALLBACK_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_MAX_TEACHER_DAILY_PERIODS = 6;
const DEFAULT_MAX_TEACHER_WEEKLY_PERIODS = 30;

const normalize = (value) => String(value || '').trim().toLowerCase();
const keyFor = (day, period) => `${day}-${Number(period)}`;
const teacherDayKey = (teacherId, day) => `${teacherId}-${day}`;

const hasSubject = (teacher, subject) => (
  (teacher.subjects || []).some((item) => normalize(item) === normalize(subject))
);

const isTeacherAvailable = (availabilityMap, teacherId, day, period) => {
  const slots = availabilityMap[teacherId];
  if (!slots || !slots[day]) return true;
  const index = Number(period) - 1;
  return slots[day][index] !== false;
};

const getTeacherScore = (teacher, cls, subject, teacherDailyLoad, teacherWeeklyLoad, day) => {
  const teacherId = teacher._id.toString();
  let score = 0;

  if ((teacher.preferredSubjects || []).some((item) => normalize(item) === normalize(subject))) score += 8;
  if ((teacher.preferredGrades || []).some((item) => normalize(item) === normalize(cls.grade))) score += 4;
  if ((teacher.classes || []).some((classId) => classId.toString() === cls._id.toString())) score += 3;
  if (cls.teacherId && cls.teacherId.toString() === teacherId) score += 2;

  score -= (teacherDailyLoad.get(teacherDayKey(teacherId, day)) || 0) * 3;
  score -= (teacherWeeklyLoad.get(teacherId) || 0);

  return score;
};

const getClassPeriods = async () => {
  const periods = await SchoolPeriod.find({ type: 'class' }).sort('periodNumber').lean();
  const periodNumbers = [...new Set(periods.map((period) => Number(period.periodNumber)).filter(Boolean))];
  return periodNumbers.length > 0 ? periodNumbers : FALLBACK_PERIODS;
};

const getSubjectMetaMap = async () => {
  const subjects = await Subject.find({ isActive: true }).lean();
  const metaMap = {};
  subjects.forEach((subject) => {
    metaMap[normalize(subject.name)] = subject;
  });
  return metaMap;
};

const getSubjectLoad = (classLoad, globalLoad, subject) => {
  const subjectKey = normalize(subject);
  return classLoad[subjectKey] || globalLoad[subjectKey] || 1;
};

const isLabSubject = (subject, subjectMeta) => {
  const value = normalize(subject);
  return value.includes('lab')
    || value.includes('practical')
    || subjectMeta?.type === 'Practical'
    || subjectMeta?.type === 'Both';
};

const getRoomType = (subject, subjectMeta) => (isLabSubject(subject, subjectMeta) ? 'Lab' : 'Classroom');

const sortSubjectsByConstraints = (subjects, classLoad, globalLoad, subjectTeacherMap, subjectMetaMap) => (
  [...subjects].sort((left, right) => {
    const leftKey = normalize(left);
    const rightKey = normalize(right);
    const leftTeachers = subjectTeacherMap[leftKey]?.length || 0;
    const rightTeachers = subjectTeacherMap[rightKey]?.length || 0;
    const leftLoad = getSubjectLoad(classLoad, globalLoad, left);
    const rightLoad = getSubjectLoad(classLoad, globalLoad, right);
    const leftLab = isLabSubject(left, subjectMetaMap[leftKey]) ? 1 : 0;
    const rightLab = isLabSubject(right, subjectMetaMap[rightKey]) ? 1 : 0;

    return (leftTeachers - rightTeachers)
      || (rightLab - leftLab)
      || (rightLoad - leftLoad)
      || left.localeCompare(right);
  })
);

const makeBookedState = () => ({
  teachersBySlot: new Map(),
  roomsBySlot: new Map(),
  teacherDailyLoad: new Map(),
  teacherWeeklyLoad: new Map(),
});

const addToSetMap = (map, key, value) => {
  if (!value) return;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value.toString());
};

const getSet = (map, key) => map.get(key) || new Set();

const incrementMap = (map, key, amount = 1) => {
  map.set(key, (map.get(key) || 0) + amount);
};

const seedExistingBookings = async (state, selectedClassIds, scheduleType, term, academicYear) => {
  const existingTimetables = await Timetable.find({
    isActive: true,
    scheduleType,
    term,
    academicYear,
    classId: { $nin: selectedClassIds },
  }).lean();

  existingTimetables.forEach((timetable) => {
    (timetable.slots || []).forEach((slot) => {
      const slotKey = keyFor(slot.day, slot.period);
      const teacherId = slot.teacherId?.toString();
      const roomId = slot.roomId?.toString();

      addToSetMap(state.teachersBySlot, slotKey, teacherId);
      addToSetMap(state.roomsBySlot, slotKey, roomId);
      if (teacherId) {
        incrementMap(state.teacherDailyLoad, teacherDayKey(teacherId, slot.day));
        incrementMap(state.teacherWeeklyLoad, teacherId);
      }
    });
  });
};

const isClassFree = (slots, day, periods) => (
  periods.every((period) => !slots.some((slot) => slot.day === day && Number(slot.period) === Number(period)))
);

const isTeacherFree = (state, teacherId, day, periods) => (
  periods.every((period) => !getSet(state.teachersBySlot, keyFor(day, period)).has(teacherId))
);

const isRoomFree = (state, roomId, day, periods) => (
  periods.every((period) => !getSet(state.roomsBySlot, keyFor(day, period)).has(roomId))
);

const findRoomForBlock = (rooms, state, roomType, day, periods, classSize) => {
  const preferredRooms = rooms
    .filter((room) => room.type === roomType && (!room.capacity || room.capacity >= classSize))
    .sort((left, right) => {
      const leftCapacityFit = Math.max((left.capacity || 0) - classSize, 0);
      const rightCapacityFit = Math.max((right.capacity || 0) - classSize, 0);
      return leftCapacityFit - rightCapacityFit || left.name.localeCompare(right.name);
    });

  const fallbackRooms = roomType === 'Classroom'
    ? rooms.filter((room) => room.type !== 'Lab' && (!room.capacity || room.capacity >= classSize))
    : [];

  return [...preferredRooms, ...fallbackRooms].find((room) => (
    isRoomFree(state, room._id.toString(), day, periods)
  )) || null;
};

const getSubjectDailyLimit = (needed, isDoubleBlock, dayCount) => {
  if (isDoubleBlock) return 2;
  return Math.max(1, Math.ceil(needed / dayCount));
};

const getClassDayLoad = (slots, day) => slots.filter((slot) => slot.day === day).length;

const getCandidateBlocks = (slots, periods, blockSize, preferNoGaps = true, workingDays = DAYS) => {
  const candidates = [];

  for (const day of workingDays) {
    const used = new Set(slots.filter((slot) => slot.day === day).map((slot) => Number(slot.period)));
    const sortedPeriods = [...periods].sort((a, b) => a - b);

    if (preferNoGaps) {
      const firstOpenIndex = sortedPeriods.findIndex((period) => !used.has(period));
      if (firstOpenIndex !== -1) {
        const block = sortedPeriods.slice(firstOpenIndex, firstOpenIndex + blockSize);
        const contiguous = blockSize === 1 || block.every((period, index) => (
          index === 0 || Number(period) === Number(block[index - 1]) + 1
        ));
        if (block.length === blockSize && contiguous && block.every((period) => !used.has(period))) {
          candidates.push({ day, periods: block, gapPenalty: 0 });
        }
      }
    }

    for (let index = 0; index <= sortedPeriods.length - blockSize; index += 1) {
      const block = sortedPeriods.slice(index, index + blockSize);
      if (block.length !== blockSize) continue;
      if (blockSize > 1 && block.some((period, blockIndex) => (
        blockIndex > 0 && Number(period) !== Number(block[blockIndex - 1]) + 1
      ))) continue;
      if (block.some((period) => used.has(period))) continue;
      candidates.push({
        day,
        periods: block,
        gapPenalty: preferNoGaps ? 5 : 0,
      });
    }
  }

  return candidates.sort((left, right) => (
    getClassDayLoad(slots, left.day) - getClassDayLoad(slots, right.day)
    || left.gapPenalty - right.gapPenalty
    || left.periods[0] - right.periods[0]
    || workingDays.indexOf(left.day) - workingDays.indexOf(right.day)
  ));
};

const reservePlacement = ({ slots, state, day, periods, subject, teacher, room }) => {
  const teacherId = teacher._id.toString();
  const roomId = room?._id?.toString() || null;

  periods.forEach((period) => {
    slots.push({
      day,
      period,
      subject: subject.trim(),
      teacherId: teacher._id,
      roomId: room?._id || null,
    });

    const slotKey = keyFor(day, period);
    addToSetMap(state.teachersBySlot, slotKey, teacherId);
    addToSetMap(state.roomsBySlot, slotKey, roomId);
    incrementMap(state.teacherDailyLoad, teacherDayKey(teacherId, day));
    incrementMap(state.teacherWeeklyLoad, teacherId);
  });
};

const tryPlaceBlock = ({
  cls,
  subject,
  teacherList,
  subjectMeta,
  slots,
  state,
  availabilityMap,
  rooms,
  periods,
  subjectDailyCount,
  subjectDailyLimit,
  blockSize,
  workingDays,
  maxTeacherDailyPeriods,
  maxTeacherWeeklyPeriods,
}) => {
  const candidates = getCandidateBlocks(slots, periods, blockSize, true, workingDays);
  const classSize = cls.students?.length || 0;
  const roomType = getRoomType(subject, subjectMeta);

  for (const candidate of candidates) {
    const subjectDayKey = `${normalize(subject)}-${candidate.day}`;
    if ((subjectDailyCount.get(subjectDayKey) || 0) + blockSize > subjectDailyLimit) continue;
    if (!isClassFree(slots, candidate.day, candidate.periods)) continue;

    const rankedTeachers = [...teacherList].sort((left, right) => (
      getTeacherScore(right, cls, subject, state.teacherDailyLoad, state.teacherWeeklyLoad, candidate.day)
      - getTeacherScore(left, cls, subject, state.teacherDailyLoad, state.teacherWeeklyLoad, candidate.day)
    ));

    for (const teacher of rankedTeachers) {
      const teacherId = teacher._id.toString();
      const dailyLoad = state.teacherDailyLoad.get(teacherDayKey(teacherId, candidate.day)) || 0;
      const weeklyLoad = state.teacherWeeklyLoad.get(teacherId) || 0;
      if (dailyLoad + blockSize > maxTeacherDailyPeriods) continue;
      if (weeklyLoad + blockSize > maxTeacherWeeklyPeriods) continue;
      if (!candidate.periods.every((period) => isTeacherAvailable(availabilityMap, teacherId, candidate.day, period))) continue;
      if (!isTeacherFree(state, teacherId, candidate.day, candidate.periods)) continue;

      const room = findRoomForBlock(rooms, state, roomType, candidate.day, candidate.periods, classSize);
      if (roomType === 'Lab' && !room) continue;

      reservePlacement({
        slots,
        state,
        day: candidate.day,
        periods: candidate.periods,
        subject,
        teacher,
        room,
      });
      incrementMap(subjectDailyCount, subjectDayKey, blockSize);
      return blockSize;
    }
  }

  return 0;
};

const generateMultipleTimetables = async (classIds, term, academicYear, options = {}) => {
  const scheduleType = options.scheduleType || 'regular';
  const workingDays = DAYS.filter((day) => (options.workingDays || DAYS).includes(day));
  const maxTeacherDailyPeriods = Number(options.maxTeacherDailyPeriods) || DEFAULT_MAX_TEACHER_DAILY_PERIODS;
  const maxTeacherWeeklyPeriods = Number(options.maxTeacherWeeklyPeriods) || DEFAULT_MAX_TEACHER_WEEKLY_PERIODS;
  const selectedClassIds = classIds.map((id) => id.toString());
  const [classes, teachers, availabilities, loads, globalLoad, rooms, periods, subjectMetaMap] = await Promise.all([
    Class.find({ _id: { $in: classIds } }).lean(),
    Teacher.find().populate('userId', 'name').lean(),
    TeacherAvailability.find().lean(),
    WeeklyLoad.find({ classId: { $in: classIds } }).lean(),
    getDefaultLoad(),
    Room.find().lean(),
    getClassPeriods(),
    getSubjectMetaMap(),
  ]);

  const availabilityMap = {};
  availabilities.forEach((availability) => {
    availabilityMap[availability.teacherId.toString()] = availability.slots;
  });

  const subjectTeacherMap = {};
  teachers.forEach((teacher) => {
    (teacher.subjects || []).forEach((subject) => {
      const subjectKey = normalize(subject);
      if (!subjectTeacherMap[subjectKey]) subjectTeacherMap[subjectKey] = [];
      subjectTeacherMap[subjectKey].push(teacher);
    });
  });

  const loadMap = {};
  loads.forEach((loadConfig) => {
    const map = {};
    (loadConfig.loads || []).forEach((load) => {
      map[normalize(load.subject)] = Number(load.periods) || 1;
    });
    loadMap[loadConfig.classId.toString()] = map;
  });

  const normalizedGlobalLoad = {};
  Object.entries(globalLoad || {}).forEach(([subject, load]) => {
    normalizedGlobalLoad[normalize(subject)] = Number(load) || 1;
  });

  const state = makeBookedState();
  await seedExistingBookings(state, selectedClassIds, scheduleType, term, academicYear);

  const classConstraintScore = (cls) => (
    (cls.subjects || []).reduce((score, subject) => {
      const teachersForSubject = subjectTeacherMap[normalize(subject)]?.length || 0;
      return score + (teachersForSubject === 0 ? 100 : teachersForSubject);
    }, 0)
  );

  classes.sort((left, right) => classConstraintScore(left) - classConstraintScore(right));

  const resultSlots = {};
  const generationReports = {};

  for (const cls of classes) {
    const classId = cls._id.toString();
    const classLoad = loadMap[classId] || {};
    const subjects = sortSubjectsByConstraints(
      cls.subjects || [],
      classLoad,
      normalizedGlobalLoad,
      subjectTeacherMap,
      subjectMetaMap
    );
    const slots = [];
    resultSlots[classId] = slots;
    const subjectResults = [];

    for (const subject of subjects) {
      const subjectKey = normalize(subject);
      const needed = getSubjectLoad(classLoad, normalizedGlobalLoad, subject);
      const subjectMeta = subjectMetaMap[subjectKey];
      const teacherList = (subjectTeacherMap[subjectKey] || []).filter((teacher) => {
        if (!hasSubject(teacher, subject)) return false;
        const hasAssignedClasses = (teacher.classes || []).length > 0;
        if (!hasAssignedClasses) return true;
        return teacher.classes.some((assignedClassId) => assignedClassId.toString() === classId)
          || cls.teacherId?.toString() === teacher._id.toString();
      });

      if (teacherList.length === 0) {
        subjectResults.push({ subject, required: needed, scheduled: 0, reason: 'No teacher is assigned to this subject.' });
        continue;
      }

      const needsDoubleBlocks = isLabSubject(subject, subjectMeta) && needed >= 2;
      const subjectDailyLimit = getSubjectDailyLimit(needed, needsDoubleBlocks, workingDays.length);
      const subjectDailyCount = new Map();
      let remaining = needed;

      while (remaining > 0) {
        const blockSize = needsDoubleBlocks && remaining >= 2 ? 2 : 1;
        const placed = tryPlaceBlock({
          cls,
          subject,
          teacherList,
          subjectMeta,
          slots,
          state,
          availabilityMap,
          rooms,
          periods,
          subjectDailyCount,
          subjectDailyLimit,
          blockSize,
          workingDays,
          maxTeacherDailyPeriods,
          maxTeacherWeeklyPeriods,
        });

        if (placed === 0) break;
        remaining -= placed;
      }

      if (remaining > 0) {
        subjectResults.push({
          subject,
          required: needed,
          scheduled: needed - remaining,
          reason: 'No remaining slot satisfies teacher availability, workload, room, and class constraints.',
        });
      } else {
        subjectResults.push({ subject, required: needed, scheduled: needed, reason: '' });
      }
    }

    slots.sort((left, right) => (
      workingDays.indexOf(left.day) - workingDays.indexOf(right.day)
      || Number(left.period) - Number(right.period)
    ));
    const requestedPeriods = subjectResults.reduce((sum, result) => sum + result.required, 0);
    const scheduledPeriods = subjectResults.reduce((sum, result) => sum + result.scheduled, 0);
    generationReports[classId] = {
      classId,
      className: cls.name,
      requestedPeriods,
      scheduledPeriods,
      unscheduledPeriods: requestedPeriods - scheduledPeriods,
      complete: subjectResults.length > 0 && requestedPeriods === scheduledPeriods,
      warnings: subjectResults.length === 0 ? ['No subjects are configured for this class.'] : [],
      subjects: subjectResults,
    };
  }

  return { slotsByClass: resultSlots, reports: generationReports };
};

module.exports = { generateMultipleTimetables };
