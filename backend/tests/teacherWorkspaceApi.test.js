import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/teacherWorkspaceController');
const service = require('../services/teacherWorkspaceService');

const withTeacher = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439099', name: 'Teacher User', role: 'teacher' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/teacher-workspace/overview', withTeacher, controller.getOverview);
  app.post('/api/teacher-workspace/leave-requests', withTeacher, controller.createLeaveRequest);
  return app;
};

describe('Teacher workspace API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the teacher workspace overview payload', async () => {
    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { attendanceRate: 92, openInterventions: 3, scheduledPTMs: 2, activeSubstitutions: 1, continuityScoreAverage: 68 },
      leaveRequests: [],
      ptms: [],
    });

    const response = await request(createApp()).get('/api/teacher-workspace/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.attendanceRate).toBe(92);
  });

  it('creates a teacher leave request with a success message', async () => {
    const payload = {
      leaveType: 'casual',
      fromDate: '2026-06-14',
      toDate: '2026-06-15',
      reason: 'Family event',
    };
    vi.spyOn(service, 'createLeaveRequest').mockResolvedValue({ _id: 'leave-1', status: 'pending' });

    const response = await request(createApp())
      .post('/api/teacher-workspace/leave-requests')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('submitted successfully');
    expect(service.createLeaveRequest).toHaveBeenCalledWith('507f1f77bcf86cd799439099', payload);
  });
});
