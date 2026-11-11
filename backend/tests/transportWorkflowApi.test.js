import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/transportWorkflowController');
const service = require('../services/transportWorkflowService');

const withTransport = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439099', name: 'Transport User', role: 'transport' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/transport-workflows/overview', withTransport, controller.getOverview);
  app.post('/api/transport-workflows/incidents', withTransport, controller.createIncident);
  return app;
};

describe('Transport workflow API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the transport workflow overview payload', async () => {
    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { totalIncidents: 3, pendingApproval: 1, parentNoticesSent: 1 },
      recentIncidents: [],
      recentNotifications: [],
    });

    const response = await request(createApp()).get('/api/transport-workflows/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalIncidents).toBe(3);
  });

  it('submits a transport incident with a success message', async () => {
    const payload = { routeId: 'route-1', severity: 'high', description: 'Dense fog on route' };
    vi.spyOn(service, 'createIncident').mockResolvedValue({ _id: 'incident-1', status: 'pending' });

    const response = await request(createApp())
      .post('/api/transport-workflows/incidents')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('submitted for approval');
    expect(service.createIncident).toHaveBeenCalledWith('507f1f77bcf86cd799439099', payload);
  });
});
