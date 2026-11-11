import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/wardenWorkflowController');
const service = require('../services/wardenWorkflowService');

const withWarden = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439077', name: 'Warden User', role: 'warden' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/warden-workflows/overview', withWarden, controller.getOverview);
  app.post('/api/warden-workflows/notes', withWarden, controller.addWorkflowNote);
  return app;
};

describe('Warden workflow API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the warden workflow overview payload', async () => {
    vi.spyOn(service, 'getOverview').mockResolvedValue({
      hostel: { _id: 'hostel-1', name: 'Iqbal Hostel' },
      summary: { residents: 84, scheduledPTMs: 3, openInterventions: 4, openClinicAlerts: 2, securityQueue: 5 },
    });

    const response = await request(createApp()).get('/api/warden-workflows/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.residents).toBe(84);
  });

  it('adds a warden workflow note with a success message', async () => {
    const payload = { entityType: 'student_intervention', entityId: 'intervention-1', actionType: 'recommend', note: 'Resident struggling after lights-out.' };
    vi.spyOn(service, 'addWorkflowNote').mockResolvedValue({ _id: 'note-1' });

    const response = await request(createApp())
      .post('/api/warden-workflows/notes')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('added successfully');
    expect(service.addWorkflowNote).toHaveBeenCalledWith('507f1f77bcf86cd799439077', payload);
  });
});
