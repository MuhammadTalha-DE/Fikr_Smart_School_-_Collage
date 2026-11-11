import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/parentWorkflowController');
const service = require('../services/parentWorkflowService');

const withParent = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439055', name: 'Parent User', role: 'parent' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/parent-workflows/overview', withParent, controller.getOverview);
  app.put('/api/parent-workflows/ptm/:id/respond', withParent, controller.respondToPTMMeeting);
  return app;
};

describe('Parent workflow API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parent workflow overview payload', async () => {
    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { children: 2, scheduledPTMs: 1, openInterventions: 2, clinicAlerts: 1, securityResponsesPending: 1 },
      children: [],
    });

    const response = await request(createApp()).get('/api/parent-workflows/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.children).toBe(2);
  });

  it('saves a parent PTM response with a success message', async () => {
    const payload = { responseStatus: 'confirmed', responseNote: 'We will attend.' };
    vi.spyOn(service, 'respondToPTMMeeting').mockResolvedValue({ _id: 'meeting-1', parentResponseStatus: 'confirmed' });

    const response = await request(createApp())
      .put('/api/parent-workflows/ptm/meeting-1/respond')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('saved successfully');
    expect(service.respondToPTMMeeting).toHaveBeenCalledWith('507f1f77bcf86cd799439055', 'meeting-1', payload);
  });
});
