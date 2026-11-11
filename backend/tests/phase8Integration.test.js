import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const authRoutes = require('../routes/authRoutes');
const { authLimiter } = require('../middleware/rateLimiter');
const attendanceController = require('../controllers/attendanceController');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const attendanceAlertService = require('../services/attendanceAlertService');
const realtimeService = require('../services/realtimeService');

const attachErrorHandler = (app) => {
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  });
};

const createAuthApp = ({ withLimiter = false } = {}) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', ...(withLimiter ? [authLimiter] : []), authRoutes);
  attachErrorHandler(app);
  return app;
};

const createAttendanceApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/attendance', (req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Phase 8 Admin',
      role: 'admin',
    };
    next();
  }, attendanceController.markAttendance);
  attachErrorHandler(app);
  return app;
};

describe('Phase 8 integration safety nets', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('locks an account after repeated failed login attempts', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Locked User',
      username: 'locked.user',
      email: 'locked@example.com',
      role: 'teacher',
      failedLoginAttempts: 0,
      lockUntil: undefined,
      matchPassword: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(user);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(createAuthApp())
        .post('/api/auth/login')
        .send({ username: user.username, password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid username or password');
    }

    const lockedResponse = await request(createAuthApp())
      .post('/api/auth/login')
      .send({ username: user.username, password: 'wrong-password' });

    expect(user.failedLoginAttempts).toBe(5);
    expect(user.lockUntil).toBeInstanceOf(Date);
    expect(lockedResponse.status).toBe(423);
    expect(lockedResponse.body.message).toContain('Account temporarily locked');
    expect(user.save).toHaveBeenCalledTimes(5);
  });

  it('rejects weak reset passwords before changing the user record', async () => {
    const findUser = vi.spyOn(User, 'findOne');

    const response = await request(createAuthApp())
      .put('/api/auth/reset-password/reset-token')
      .send({ password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(expect.arrayContaining([
      'Password must be at least 10 characters',
      'Password must include an uppercase letter',
      'Password must include a number',
      'Password must include a special character',
    ]));
    expect(findUser).not.toHaveBeenCalled();
  });

  it('applies strict rate limiting to auth routes', async () => {
    const app = createAuthApp({ withLimiter: true });
    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'rate.limit', password: 'wrong-password' });

      expect(response.status).toBe(401);
    }

    const limitedResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rate.limit', password: 'wrong-password' });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body.message).toContain('Too many login attempts');
  });

  it('saves attendance and emits the realtime attendance event', async () => {
    vi.spyOn(Teacher, 'findOne').mockResolvedValue({ _id: 'teacher-1' });
    vi.spyOn(Class, 'findById').mockResolvedValue({ _id: 'class-1', name: 'Grade 10 A' });
    vi.spyOn(Attendance, 'bulkWrite').mockResolvedValue({ modifiedCount: 2 });
    vi.spyOn(attendanceAlertService, 'sendAbsenceAlert').mockResolvedValue(undefined);
    const realtimeSpy = vi.spyOn(realtimeService, 'emitAttendanceMarked').mockReturnValue({
      domain: 'attendance',
      action: 'marked',
    });

    const payload = {
      classId: 'class-1',
      date: '2026-07-04',
      method: 'manual',
      records: [
        { studentId: 'student-1', status: 'present' },
        { studentId: 'student-2', status: 'absent', remarks: 'Sick leave pending' },
      ],
    };

    const response = await request(createAttendanceApp())
      .post('/api/attendance')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Attendance saved successfully', count: 2 });
    expect(Attendance.bulkWrite).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ updateOne: expect.any(Object) }),
    ]));
    expect(attendanceAlertService.sendAbsenceAlert).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student-2',
      className: 'Grade 10 A',
      status: 'absent',
    }));
    expect(realtimeSpy).toHaveBeenCalledWith(expect.objectContaining({
      classId: 'class-1',
      date: '2026-07-04',
      count: 2,
      method: 'manual',
      actor: expect.objectContaining({ role: 'admin', name: 'Phase 8 Admin' }),
    }));
  });
});
