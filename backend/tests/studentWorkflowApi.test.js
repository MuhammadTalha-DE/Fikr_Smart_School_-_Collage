import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/studentWorkflowController');
const service = require('../services/studentWorkflowService');

const withStudent = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439011', name: 'Student User', role: 'student' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/student-workflows/overview', withStudent, controller.getOverview);
  app.put('/api/student-workflows/ptm/:id/acknowledge', withStudent, controller.acknowledgePTMMeeting);
  return app;
};

describe('Student workflow API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the student workflow overview payload', async () => {
    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { scheduledPTMs: 2, pendingParentResponses: 1, gatePasses: 3, transportNotices: 1 },
      recentTransportNotices: [],
    });

    const response = await request(createApp()).get('/api/student-workflows/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.scheduledPTMs).toBe(2);
  });

  it('acknowledges a student PTM with a success message', async () => {
    const payload = { note: 'I saw this on my dashboard.' };
    vi.spyOn(service, 'acknowledgePTMMeeting').mockResolvedValue({ _id: 'meeting-1', studentAcknowledgedAt: new Date().toISOString() });

    const response = await request(createApp())
      .put('/api/student-workflows/ptm/meeting-1/acknowledge')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('acknowledged successfully');
    expect(service.acknowledgePTMMeeting).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'meeting-1', payload);
  });
});
