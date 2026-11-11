const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const Teacher = require('../models/Teacher');
const SchoolPeriod = require('../models/SchoolPeriod');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FALLBACK_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const getClassPeriods = async () => {
  const periods = await SchoolPeriod.find({ type: 'class' }).sort('periodNumber').lean();
  const values = [...new Set(periods.map((period) => Number(period.periodNumber)).filter(Boolean))];
  return values.length > 0 ? values : FALLBACK_PERIODS;
};

const buildTimetableFilter = (query = {}) => {
  const filter = { isActive: true };
  if (query.status) filter.status = query.status;
  if (query.term) filter.term = query.term;
  if (query.academicYear) filter.academicYear = query.academicYear;
  if (query.scheduleType) filter.scheduleType = query.scheduleType;
  return filter;
};

const getRoomUtilization = async (query = {}) => {
  const [rooms, timetables, periods] = await Promise.all([
    Room.find().sort('name').lean(),
    Timetable.find(buildTimetableFilter(query))
      .populate('classId', 'name')
      .populate('slots.roomId', 'name type capacity')
      .lean(),
    getClassPeriods(),
  ]);

  const totalPossibleSlots = DAYS.length * periods.length;
  const usage = new Map();

  rooms.forEach((room) => {
    usage.set(room._id.toString(), {
      room,
      usedSlots: 0,
      byDay: DAYS.reduce((acc, day) => ({ ...acc, [day]: 0 }), {}),
      slots: [],
    });
  });

  timetables.forEach((timetable) => {
    (timetable.slots || []).forEach((slot) => {
      const roomId = slot.roomId?._id?.toString() || slot.roomId?.toString();
      if (!roomId || !usage.has(roomId)) return;

      const entry = usage.get(roomId);
      entry.usedSlots += 1;
      entry.byDay[slot.day] = (entry.byDay[slot.day] || 0) + 1;
      entry.slots.push({
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        className: timetable.classId?.name || '',
        timetableId: timetable._id,
      });
    });
  });

  return Array.from(usage.values()).map((entry) => ({
    roomId: entry.room._id,
    roomName: entry.room.name,
    roomType: entry.room.type,
    capacity: entry.room.capacity,
    usedSlots: entry.usedSlots,
    availableSlots: Math.max(totalPossibleSlots - entry.usedSlots, 0),
    utilizationPercent: totalPossibleSlots
      ? Math.round((entry.usedSlots / totalPossibleSlots) * 100)
      : 0,
    byDay: entry.byDay,
    slots: entry.slots.sort((left, right) => (
      DAYS.indexOf(left.day) - DAYS.indexOf(right.day)
      || Number(left.period) - Number(right.period)
    )),
  }));
};

const getTeacherWorkloadHeatmap = async (query = {}) => {
  const [teachers, timetables, periods] = await Promise.all([
    Teacher.find().populate('userId', 'name email').lean(),
    Timetable.find(buildTimetableFilter(query))
      .populate('classId', 'name')
      .lean(),
    getClassPeriods(),
  ]);

  const teacherMap = new Map();
  teachers.forEach((teacher) => {
    teacherMap.set(teacher._id.toString(), {
      teacherId: teacher._id,
      teacherName: teacher.userId?.name || 'Unknown teacher',
      subjects: teacher.subjects || [],
      totalPeriods: 0,
      byDay: DAYS.reduce((acc, day) => ({ ...acc, [day]: 0 }), {}),
      heatmap: DAYS.reduce((dayAcc, day) => ({
        ...dayAcc,
        [day]: periods.reduce((periodAcc, period) => ({ ...periodAcc, [period]: 0 }), {}),
      }), {}),
      slots: [],
    });
  });

  timetables.forEach((timetable) => {
    (timetable.slots || []).forEach((slot) => {
      const teacherId = slot.teacherId?._id?.toString() || slot.teacherId?.toString();
      if (!teacherId || !teacherMap.has(teacherId)) return;

      const entry = teacherMap.get(teacherId);
      entry.totalPeriods += 1;
      entry.byDay[slot.day] = (entry.byDay[slot.day] || 0) + 1;
      if (!entry.heatmap[slot.day]) entry.heatmap[slot.day] = {};
      entry.heatmap[slot.day][slot.period] = (entry.heatmap[slot.day][slot.period] || 0) + 1;
      entry.slots.push({
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        className: timetable.classId?.name || '',
        timetableId: timetable._id,
      });
    });
  });

  return Array.from(teacherMap.values())
    .map((entry) => ({
      ...entry,
      maxDailyLoad: Math.max(...Object.values(entry.byDay)),
      averageDailyLoad: DAYS.length ? Number((entry.totalPeriods / DAYS.length).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.totalPeriods - left.totalPeriods || left.teacherName.localeCompare(right.teacherName));
};

module.exports = {
  getRoomUtilization,
  getTeacherWorkloadHeatmap,
};
