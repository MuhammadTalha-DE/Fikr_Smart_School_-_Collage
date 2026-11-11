const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const TransportAllocation = require('../models/TransportAllocation');
const Conversation = require('../models/Conversation');

let io;
let dashboardRefreshInterval;

const onlineUsers = new Map();

const MODULES_BY_ROLE = {
  admin: ['notifications', 'attendance', 'finance', 'timetable'],
  teacher: ['notifications', 'attendance', 'timetable'],
  student: ['notifications', 'attendance', 'timetable'],
  parent: ['notifications', 'attendance', 'finance', 'timetable'],
  librarian: ['notifications'],
  warden: ['notifications', 'attendance'],
  transport: ['notifications', 'attendance'],
  driver: ['notifications', 'attendance'],
};

const principalOf = (socket) => socket.data.principal;

const getAuthorizedMembership = async (principal) => {
  const membership = { classIds: new Set(), vehicleIds: new Set() };
  const userId = principal.userId;

  if (principal.role === 'admin' || principal.role === 'transport' || principal.role === 'driver') {
    return { ...membership, canAccessAnyVehicle: true, canAccessAnyClass: principal.role === 'admin' };
  }

  if (principal.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId }).select('classes').lean();
    (teacher?.classes || []).forEach((classId) => membership.classIds.add(String(classId)));
  } else if (principal.role === 'student') {
    const student = await Student.findOne({ userId }).select('_id classId').lean();
    if (student?.classId) membership.classIds.add(String(student.classId));
    if (student?._id) {
      const allocations = await TransportAllocation.find({ student: student._id, isActive: true }).select('vehicle').lean();
      allocations.forEach((allocation) => membership.vehicleIds.add(String(allocation.vehicle)));
    }
  } else if (principal.role === 'parent') {
    const parent = await Parent.findOne({ userId }).select('children').lean();
    const children = parent?.children || [];
    if (children.length) {
      const students = await Student.find({ _id: { $in: children } }).select('_id classId').lean();
      const studentIds = students.map((student) => student._id);
      students.forEach((student) => { if (student.classId) membership.classIds.add(String(student.classId)); });
      const allocations = await TransportAllocation.find({ student: { $in: studentIds }, isActive: true }).select('vehicle').lean();
      allocations.forEach((allocation) => membership.vehicleIds.add(String(allocation.vehicle)));
    }
  }

  return { ...membership, canAccessAnyVehicle: false, canAccessAnyClass: false };
};

const addOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId) || new Set();
  const firstSocket = sockets.size === 0;
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
  if (firstSocket) io.emit('user-online', userId);
};

const removeOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    if (io) io.emit('user-offline', userId);
  }
};

const sanitizeRoomPart = (value) => String(value || '')
  .trim()
  .replace(/[^a-zA-Z0-9:_-]/g, '');

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || !process.env.JWT_SECRET) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id role').lean();
      if (!user) return next(new Error('Authentication required'));
      socket.data.principal = { userId: String(user._id), role: user.role };
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  if (!dashboardRefreshInterval) {
    dashboardRefreshInterval = setInterval(() => {
      if (io) {
        io.to('role:admin').emit('dashboard:refresh', {
          generatedAt: new Date().toISOString(),
        });
      }
    }, 30000);
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    const principal = principalOf(socket);
    const userRoom = sanitizeRoomPart(principal.userId);
    const roleRoom = sanitizeRoomPart(principal.role);
    socket.join(userRoom);
    socket.join(`user:${userRoom}`);
    socket.join(`role:${roleRoom}`);
    const allowedModules = MODULES_BY_ROLE[principal.role] || ['notifications'];
    allowedModules.forEach((moduleName) => socket.join(`module:${moduleName}`));
    addOnlineSocket(userRoom, socket.id);
    socket.data.membershipPromise = getAuthorizedMembership(principal)
      .then((membership) => {
        membership.classIds.forEach((classId) => socket.join(`class:${classId}`));
        return membership;
      })
      .catch((error) => {
        console.warn('Socket memberships unavailable:', error.message);
        return { classIds: new Set(), vehicleIds: new Set(), canAccessAnyVehicle: false, canAccessAnyClass: false };
      });

    // Weather rooms are scoped from the verified role, never from client input.
    const weatherRole = principal.role === 'warden' ? 'hostel' : principal.role;
    socket.join(`weather:${weatherRole}`);

    try {
      const scheduler = require('../services/periodScheduler');
      socket.emit('period-update', scheduler.getCurrentState());
    } catch (error) {
      console.warn('Period state unavailable:', error.message);
    }

    try {
      require('./weatherSocketServer').registerSocketEvents(socket);
    } catch (error) {
      console.warn('Weather socket events unavailable:', error.message);
    }

    socket.on('join:rooms', async (payload = {}, acknowledge = () => {}) => {
      try {
        const { classIds = [], modules = [] } = payload || {};
        const membership = await socket.data.membershipPromise;
        const joined = [];
        for (const classId of classIds) {
          const safeClassId = sanitizeRoomPart(classId);
          if (safeClassId && (membership.canAccessAnyClass || membership.classIds.has(safeClassId))) {
            socket.join(`class:${safeClassId}`);
            joined.push(`class:${safeClassId}`);
          }
        }
        const allowed = MODULES_BY_ROLE[principal.role] || [];
        for (const moduleName of modules) {
          if (allowed.includes(moduleName)) {
            socket.join(`module:${moduleName}`);
            joined.push(`module:${moduleName}`);
          }
        }
        acknowledge({ joined, denied: classIds.length + modules.length - joined.length });
      } catch {
        acknowledge({ joined: [], error: 'Unable to validate subscriptions' });
      }
    });

    socket.on('leave:rooms', (payload = {}) => {
      const classIds = Array.isArray(payload?.classIds) ? payload.classIds : [];
      const modules = Array.isArray(payload?.modules) ? payload.modules : [];
      classIds.forEach((classId) => socket.leave(`class:${sanitizeRoomPart(classId)}`));
      modules.forEach((moduleName) => {
        if ((MODULES_BY_ROLE[principal.role] || []).includes(moduleName)) socket.leave(`module:${moduleName}`);
      });
    });

    socket.on('join-vehicle-room', async (vehicleId, acknowledge = () => {}) => {
      try {
        const safeVehicleId = sanitizeRoomPart(vehicleId);
        const membership = await socket.data.membershipPromise;
        if (!safeVehicleId || (!membership.canAccessAnyVehicle && !membership.vehicleIds.has(safeVehicleId))) {
          acknowledge({ joined: false, error: 'Not authorized for this vehicle' });
          return;
        }
        socket.join(`vehicle-${safeVehicleId}`);
        acknowledge({ joined: true });
      } catch {
        acknowledge({ joined: false, error: 'Unable to validate vehicle access' });
      }
    });

    socket.on('leave-vehicle-room', (vehicleId) => {
      const safeVehicleId = sanitizeRoomPart(vehicleId);
      if (safeVehicleId) socket.leave(`vehicle-${safeVehicleId}`);
    });

    socket.on('send-message', (_data, acknowledge = () => {}) => {
      acknowledge({ error: 'Send messages through the authenticated message API' });
    });

    socket.on('typing', async (data = {}, acknowledge = () => {}) => {
      try {
        const conversation = await Conversation.findOne({
          _id: data.conversationId,
          participants: principal.userId,
        }).select('participants').lean();
        if (!conversation) {
          acknowledge({ error: 'Not authorized for this conversation' });
          return;
        }
        const recipientId = conversation.participants.find((id) => String(id) !== principal.userId);
        if (!recipientId) {
          acknowledge({ error: 'Conversation recipient not found' });
          return;
        }
        io.to(String(recipientId)).emit('user-typing', {
          conversationId: String(conversation._id),
          userId: principal.userId,
          isTyping: Boolean(data.isTyping),
        });
        acknowledge({ sent: true });
      } catch {
        acknowledge({ error: 'Unable to validate conversation access' });
      }
    });

    socket.on('disconnect', () => {
      removeOnlineSocket(principal.userId, socket.id);
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const closeSocket = async () => {
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
    dashboardRefreshInterval = null;
  }
  if (io) {
    const activeIO = io;
    await new Promise((resolve) => activeIO.close(() => {
      if (io === activeIO) io = null;
      resolve();
    }));
  }
  onlineUsers.clear();
};

module.exports = { initSocket, getIO, closeSocket };
