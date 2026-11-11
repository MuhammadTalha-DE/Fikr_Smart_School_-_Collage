import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/securityGateController');
const service = require('../services/securityGateService');

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
  app.get('/api/security-gate/admin/overview', withAdmin, controller.getAdminOverview);
  app.post('/api/security-gate/notices', withAdmin, controller.createNotice);
  return app;
};

describe('Security gate API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the security overview payload', async () => {
    vi.spyOn(service, 'getAdminOverview').mockResolvedValue({
      summary: { activeVisitors: 4, pendingStudentPasses: 2, pendingStaffPasses: 1, activeSecurityNotices: 3, lockdownNotices: 1 },
      visitors: [],
      notices: [],
    });

    const response = await request(createApp()).get('/api/security-gate/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.activeVisitors).toBe(4);
  });

  it('creates a security notice with a success message', async () => {
    vi.spyOn(service, 'createNotice').mockResolvedValue({
      _id: 'notice-1',
      title: 'Gate restriction',
      status: 'active',
    });

    const payload = {
      title: 'Gate restriction',
      noticeType: 'lockdown',
      audience: 'all',
      message: 'Use only the main gate until clearance.',
    };

    const response = await request(createApp())
      .post('/api/security-gate/notices')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('created successfully');
    expect(service.createNotice).toHaveBeenCalledWith(payload, '507f1f77bcf86cd799439011');
  });
});
