import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const hrPayrollController = require('../controllers/hrPayrollController');
const hrPayrollService = require('../services/hrPayrollService');

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
  app.get('/api/hr-payroll/admin/overview', withAdmin, hrPayrollController.getAdminOverview);
  return app;
};

describe('HR & Payroll API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the admin HR & Payroll overview payload', async () => {
    vi.spyOn(hrPayrollService, 'getAdminOverview').mockResolvedValue({
      summary: { totalStaff: 12, teachers: 7, operationsStaff: 5, departments: 4 },
      teacherAttendance: { month: { percentage: 92 } },
      departmentBreakdown: [],
      recentStaff: [],
      recentSignals: { notifications: [], audits: [] },
      payrollWindow: { monthLabel: 'June 2026', payableStaff: 12, cycleStatus: 'attendance-ready' },
      moduleReadiness: [],
    });

    const response = await request(createApp()).get('/api/hr-payroll/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalStaff).toBe(12);
    expect(response.body.data.payrollWindow.monthLabel).toBe('June 2026');
  });
});
