import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const portalController = require('../controllers/hostelPortalController');
const portalService = require('../services/hostelPortalService');

const withRole = (role) => (req, res, next) => {
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    name: `${role} user`,
    role,
  };
  next();
};

const createApp = () => {
  const app = express();
  app.get('/api/hostel-portal/admin/overview', withRole('admin'), portalController.getAdminOverview);
  app.get('/api/hostel-portal/student/status', withRole('student'), portalController.getStudentStatus);
  return app;
};

describe('Hostel portal API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the admin hostel overview payload', async () => {
    vi.spyOn(portalService, 'getAdminOverview').mockResolvedValue({
      hostels: [],
      summary: { totalHostels: 2, activeResidents: 84, openComplaints: 3, attendanceRate: 91 },
      feeSummary: { totalAmount: 300000, paidAmount: 220000, dueAmount: 80000, paidRate: 73 },
      recentApplications: [],
      recentLeaves: [],
      recentVisitors: [],
      recentComplaints: [],
    });

    const response = await request(createApp()).get('/api/hostel-portal/admin/overview');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalHostels).toBe(2);
    expect(response.body.data.feeSummary.dueAmount).toBe(80000);
  });

  it('returns the student hostel status payload', async () => {
    vi.spyOn(portalService, 'getStudentStatus').mockResolvedValue({
      status: 'active',
      hostel: { _id: 'hostel-1', name: 'Iqbal Hostel' },
      room: { _id: 'room-1', roomNumber: 'A-12' },
      bed: { _id: 'bed-1', bedNumber: 'B2' },
    });

    const response = await request(createApp()).get('/api/hostel-portal/student/status');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('active');
    expect(response.body.hostel.name).toBe('Iqbal Hostel');
    expect(response.body.room.roomNumber).toBe('A-12');
  });
});
