import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const controller = require('../controllers/adminOperationsController');
const service = require('../services/adminOperationsService');

const withAdmin = (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439011', name: 'Admin User', role: 'admin' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/admin-operations/overview', withAdmin, controller.getAdminOverview);
  app.post('/api/admin-operations/approvals/action', withAdmin, controller.applyApprovalAction);
  return app;
};

describe('Admin operations API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the admin operations overview payload', async () => {
    vi.spyOn(service, 'getAdminOverview').mockResolvedValue({
      summary: { budgetLines: 8, pendingApprovals: 5, complianceItems: 3, monthlyCollections: 200000 },
      principalSignals: [],
    });

    const response = await request(createApp()).get('/api/admin-operations/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.pendingApprovals).toBe(5);
  });

  it('applies an approval workflow action with a success message', async () => {
    const payload = { entityType: 'purchase_request', entityId: 'workflow-1', decision: 'approved' };
    vi.spyOn(service, 'applyApprovalAction').mockResolvedValue({ _id: 'workflow-1', status: 'approved' });

    const response = await request(createApp())
      .post('/api/admin-operations/approvals/action')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('approved');
    expect(service.applyApprovalAction).toHaveBeenCalledWith(payload, '507f1f77bcf86cd799439011');
  });
});
