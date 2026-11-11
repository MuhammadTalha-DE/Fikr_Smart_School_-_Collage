import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/medicalClinicController');
const service = require('../services/medicalClinicService');

const withAdmin = (req, res, next) => {
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    role: 'admin',
  };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/medical-clinic/admin/overview', withAdmin, controller.getAdminOverview);
  app.post('/api/medical-clinic/visits', withAdmin, controller.createVisit);
  return app;
};

describe('Medical clinic API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the clinic overview payload', async () => {
    vi.spyOn(service, 'getAdminOverview').mockResolvedValue({
      summary: { profiles: 120, clinicVisits: 12, medicineLogs: 8, openIncidents: 2, parentAlerts: 3, hostelHealthIncidents: 1 },
      recentVisits: [],
      incidents: [],
    });

    const response = await request(createApp()).get('/api/medical-clinic/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.profiles).toBe(120);
  });

  it('records a clinic visit with a success message', async () => {
    vi.spyOn(service, 'createVisit').mockResolvedValue({
      _id: 'visit-1',
      symptoms: 'Headache',
      disposition: 'Rest',
    });

    const payload = {
      studentId: '507f1f77bcf86cd799439012',
      symptoms: 'Headache',
      diagnosis: 'Fatigue',
      treatment: 'Observation and hydration',
      disposition: 'Rest',
    };

    const response = await request(createApp())
      .post('/api/medical-clinic/visits')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('recorded successfully');
    expect(service.createVisit).toHaveBeenCalledWith(payload, '507f1f77bcf86cd799439011');
  });
});
