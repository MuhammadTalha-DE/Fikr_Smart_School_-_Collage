const { getIO } = require('../socket/socketServer');

const sanitizeRoomPart = (value) => String(value || '')
  .trim()
  .replace(/[^a-zA-Z0-9:_-]/g, '');

const makeRoom = (type, value) => {
  const safeValue = sanitizeRoomPart(value);
  return safeValue ? `${type}:${safeValue}` : null;
};

const rooms = {
  user: (id) => makeRoom('user', id),
  role: (role) => makeRoom('role', role),
  class: (id) => makeRoom('class', id),
  module: (name) => makeRoom('module', name),
  vehicle: (id) => `vehicle-${sanitizeRoomPart(id)}`,
};

const compactRooms = (roomList = []) => [...new Set(roomList.filter(Boolean))];

const emitToRooms = (roomList, event, payload) => {
  try {
    const io = getIO();
    const targetRooms = compactRooms(roomList);

    if (targetRooms.length === 0) {
      io.emit(event, payload);
      return true;
    }

    targetRooms.forEach((room) => {
      io.to(room).emit(event, payload);
    });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Realtime] ${event} skipped: ${error.message}`);
    }
    return false;
  }
};

const emitDomainEvent = (domain, action, payload = {}, options = {}) => {
  const event = {
    domain,
    action,
    payload,
    actor: options.actor || null,
    generatedAt: new Date().toISOString(),
  };

  const targetRooms = compactRooms([
    rooms.module(domain),
    ...(options.rooms || []),
  ]);

  emitToRooms(targetRooms, 'realtime:event', event);
  emitToRooms(targetRooms, `${domain}:${action}`, event);

  return event;
};

const emitAttendanceMarked = ({ classId, date, count, method, actor }) => emitDomainEvent(
  'attendance',
  'marked',
  { classId, date, count, method },
  {
    actor,
    rooms: [rooms.role('admin'), rooms.role('teacher'), rooms.class(classId)],
  }
);

const emitFinanceUpdated = ({ accountId, studentId, userIds = [], amount, dueAmount, status, actor }) => emitDomainEvent(
  'finance',
  'updated',
  { accountId, studentId, amount, dueAmount, status },
  {
    actor,
    rooms: [rooms.role('admin'), ...userIds.map((userId) => rooms.user(userId))],
  }
);

const emitTimetableUpdated = ({ timetableId, classId, status, term, academicYear, scheduleType, actor }) => emitDomainEvent(
  'timetable',
  'updated',
  { timetableId, classId, status, term, academicYear, scheduleType },
  {
    actor,
    rooms: [rooms.role('admin'), rooms.role('teacher'), rooms.role('student'), rooms.class(classId)],
  }
);

module.exports = {
  rooms,
  emitToRooms,
  emitDomainEvent,
  emitAttendanceMarked,
  emitFinanceUpdated,
  emitTimetableUpdated,
};
