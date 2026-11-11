const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const Teacher = require('../models/Teacher');
const TeacherAvailability = require('../models/TeacherAvailability');
const SchoolPeriod = require('../models/SchoolPeriod');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FALLBACK_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const idEquals = (left, right) => {
  if (!left || !right) return false;
  return left.toString() === right.toString();
};

const sameSlot = (slot, day, period) => slot.day === day && Number(slot.period) === Number(period);
const normalize = (value) => String(value || '').trim().toLowerCase();

const getClassPeriods = async () => {
  const periods = await SchoolPeriod.find({ type: 'class' }).sort('periodNumber').lean();
  const values = [...new Set(periods.map((period) => Number(period.periodNumber)).filter(Boolean))];
  return values.length > 0 ? values : FALLBACK_PERIODS;
};

const getTeacherName = (teacher) => teacher?.userId?.name || teacher?.name || 'teacher';
const getRoomName = (room) => room?.name || 'room';

const buildConflictQuery = ({ day, period, teacherId, classId, roomId, scheduleType, term, academicYear }, excludeTimetableId) => {
  const probes = [];

  if (teacherId) {
    probes.push({
      slots: {
        $elemMatch: {
          day,
          period: Number(period),
          teacherId,
        },
      },
    });
  }

  if (roomId) {
    probes.push({
      slots: {
        $elemMatch: {
          day,
          period: Number(period),
          roomId,
        },
      },
    });
  }

  if (classId) {
    probes.push({
      classId,
      slots: {
        $elemMatch: {
          day,
          period: Number(period),
        },
      },
    });
  }

  if (probes.length === 0) return null;

  const query = {
    isActive: true,
    $or: probes,
  };

  if (scheduleType) query.scheduleType = scheduleType;
  if (term) query.term = term;
  if (academicYear) query.academicYear = academicYear;
  if (excludeTimetableId) query._id = { $ne: excludeTimetableId };

  return query;
};

const checkSlotConflicts = async (slot, excludeTimetableId = null) => {
  const { day, period, teacherId, classId, roomId } = slot;
  const query = buildConflictQuery(slot, excludeTimetableId);
  if (!query) return [];

  const conflictingTimetables = await Timetable.find(query)
    .populate('classId', 'name')
    .populate('slots.teacherId', 'userId')
    .populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } })
    .populate('slots.roomId', 'name');

  const conflicts = [];

  for (const timetable of conflictingTimetables) {
    const slotDetails = timetable.slots.filter((candidate) => sameSlot(candidate, day, period));
    for (const slotDetail of slotDetails) {
      const className = timetable.classId?.name || 'Unknown class';

      if (classId && idEquals(timetable.classId?._id || timetable.classId, classId)) {
        conflicts.push(`Conflict in ${className} (${day} P${period}): Class already has a scheduled slot.`);
      }

      if (teacherId && idEquals(slotDetail.teacherId?._id || slotDetail.teacherId, teacherId)) {
        conflicts.push(`Conflict in ${className} (${day} P${period}): Teacher ${slotDetail.teacherId?.userId?.name || ''} already occupied.`);
      }

      if (roomId && idEquals(slotDetail.roomId?._id || slotDetail.roomId, roomId)) {
        conflicts.push(`Conflict in ${className} (${day} P${period}): Room ${slotDetail.roomId?.name || ''} already occupied.`);
      }
    }
  }

  return [...new Set(conflicts)];
};

const isTeacherAvailable = async (teacherId, day, period) => {
  if (!teacherId) return true;
  const availability = await TeacherAvailability.findOne({ teacherId }).lean();
  if (!availability?.slots?.[day]) return true;
  return availability.slots[day][Number(period) - 1] !== false;
};

const hasInternalClassSlot = (timetable, day, period) => (
  (timetable?.slots || []).some((slot) => sameSlot(slot, day, period))
);

const isExternalSlotFree = async (slot, excludeTimetableId) => {
  const conflicts = await checkSlotConflicts(slot, excludeTimetableId);
  return conflicts.length === 0;
};

const findMoveSuggestions = async (slot, excludeTimetableId, timetable = null, limit = 3) => {
  const suggestions = [];
  const periods = await getClassPeriods();
  const classId = slot.classId || timetable?.classId;
  if (!classId) return suggestions;

  for (const day of DAYS) {
    for (const period of periods) {
      if (sameSlot(slot, day, period)) continue;
      if (hasInternalClassSlot(timetable, day, period)) continue;

      const candidate = {
        ...slot,
        classId,
        day,
        period,
      };

      if (!await isTeacherAvailable(candidate.teacherId, day, period)) continue;
      if (!await isExternalSlotFree(candidate, excludeTimetableId)) continue;

      suggestions.push({
        action: 'moveSlot',
        label: `Move to ${day} P${period}`,
        day,
        period,
      });
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
};

const findRoomSuggestions = async (slot, excludeTimetableId, limit = 3) => {
  if (!slot.roomId) return [];

  const currentRoomId = slot.roomId?._id || slot.roomId;
  const currentRoom = slot.roomId?._id ? slot.roomId : null;
  const rooms = await Room.find({ _id: { $ne: currentRoomId } }).sort('type capacity name').lean();
  const sortedRooms = [...rooms].sort((left, right) => {
    const leftSameType = currentRoom?.type && left.type === currentRoom.type ? 0 : 1;
    const rightSameType = currentRoom?.type && right.type === currentRoom.type ? 0 : 1;
    return leftSameType - rightSameType || left.name.localeCompare(right.name);
  });

  const suggestions = [];
  for (const room of sortedRooms) {
    const candidate = {
      ...slot,
      roomId: room._id,
    };
    if (!await isExternalSlotFree(candidate, excludeTimetableId)) continue;

    suggestions.push({
      action: 'changeRoom',
      label: `Use ${room.name}`,
      roomId: room._id,
      roomName: room.name,
    });
    if (suggestions.length >= limit) break;
  }

  return suggestions;
};

const findTeacherSuggestions = async (slot, excludeTimetableId, limit = 3) => {
  if (!slot.subject) return [];

  const currentTeacherId = slot.teacherId?._id || slot.teacherId;
  const teachers = await Teacher.find({ _id: { $ne: currentTeacherId } })
    .populate('userId', 'name')
    .lean();

  const eligible = teachers.filter((teacher) => (
    (teacher.subjects || []).some((subject) => normalize(subject) === normalize(slot.subject))
  ));

  const suggestions = [];
  for (const teacher of eligible) {
    if (!await isTeacherAvailable(teacher._id, slot.day, slot.period)) continue;
    const candidate = {
      ...slot,
      teacherId: teacher._id,
    };
    if (!await isExternalSlotFree(candidate, excludeTimetableId)) continue;

    suggestions.push({
      action: 'changeTeacher',
      label: `Assign ${getTeacherName(teacher)}`,
      teacherId: teacher._id,
      teacherName: getTeacherName(teacher),
    });
    if (suggestions.length >= limit) break;
  }

  return suggestions;
};

const getSlotConflictSuggestions = async (slot, excludeTimetableId = null, timetable = null) => {
  const [moveSuggestions, roomSuggestions, teacherSuggestions] = await Promise.all([
    findMoveSuggestions(slot, excludeTimetableId, timetable),
    findRoomSuggestions(slot, excludeTimetableId),
    findTeacherSuggestions(slot, excludeTimetableId),
  ]);

  return [
    ...moveSuggestions,
    ...roomSuggestions,
    ...teacherSuggestions,
    {
      action: 'removeSlot',
      label: `Remove ${slot.day} P${slot.period}`,
      day: slot.day,
      period: slot.period,
    },
  ];
};

const getInternalTimetableConflicts = (timetable) => {
  const conflicts = [];
  const classSlotMap = new Map();
  const teacherSlotMap = new Map();
  const roomSlotMap = new Map();

  for (const slot of timetable.slots || []) {
    const slotKey = `${slot.day}-${Number(slot.period)}`;
    const teacherId = slot.teacherId?._id || slot.teacherId;
    const roomId = slot.roomId?._id || slot.roomId;

    if (classSlotMap.has(slotKey)) {
      conflicts.push({
        day: slot.day,
        period: slot.period,
        message: `Class has multiple scheduled slots in ${slot.day} P${slot.period}.`,
      });
    }
    classSlotMap.set(slotKey, true);

    if (teacherId) {
      const teacherKey = `${slotKey}-${teacherId.toString()}`;
      if (teacherSlotMap.has(teacherKey)) {
        conflicts.push({
          day: slot.day,
          period: slot.period,
          message: `Teacher is duplicated inside this timetable at ${slot.day} P${slot.period}.`,
        });
      }
      teacherSlotMap.set(teacherKey, true);
    }

    if (roomId) {
      const roomKey = `${slotKey}-${roomId.toString()}`;
      if (roomSlotMap.has(roomKey)) {
        conflicts.push({
          day: slot.day,
          period: slot.period,
          message: `Room is duplicated inside this timetable at ${slot.day} P${slot.period}.`,
        });
      }
      roomSlotMap.set(roomKey, true);
    }
  }

  return conflicts;
};

const getTimetableConflicts = async (timetableId) => {
  const timetable = await Timetable.findById(timetableId)
    .populate('slots.teacherId')
    .populate('slots.roomId');
  if (!timetable) return [];

  const allConflicts = getInternalTimetableConflicts(timetable);

  for (const slot of timetable.slots || []) {
    const slotProbe = {
      day: slot.day,
      period: slot.period,
      subject: slot.subject,
      teacherId: slot.teacherId?._id || slot.teacherId,
      classId: timetable.classId,
      roomId: slot.roomId?._id || slot.roomId,
      scheduleType: timetable.scheduleType,
      term: timetable.term,
      academicYear: timetable.academicYear,
    };
    const conflicts = await checkSlotConflicts({
      ...slotProbe,
    }, timetableId);

    const suggestions = conflicts.length > 0
      ? await getSlotConflictSuggestions(slotProbe, timetableId, timetable)
      : [];

    conflicts.forEach((message) => {
      allConflicts.push({ day: slot.day, period: slot.period, message, suggestions });
    });
  }

  return Promise.all(allConflicts.map(async (conflict) => ({
    ...conflict,
    suggestions: conflict.suggestions || await getSlotConflictSuggestions({
      day: conflict.day,
      period: conflict.period,
      classId: timetable.classId,
      scheduleType: timetable.scheduleType,
      term: timetable.term,
      academicYear: timetable.academicYear,
    }, timetableId, timetable),
  })));
};

module.exports = {
  checkSlotConflicts,
  getSlotConflictSuggestions,
  getTimetableConflicts,
};
