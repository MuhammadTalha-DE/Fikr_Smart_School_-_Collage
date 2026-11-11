import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const auditController = require('../controllers/auditController');
const notificationController = require('../controllers/notificationController');
const notificationCenterService = require('../services/notificationCenterService');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const NotificationReceipt = require('../models/NotificationReceipt');

const {
  getAuditLogs,
  getAuditStats,
} = auditController;

const {
  createNotification,
  getInbox,
  markAsRead,
} = notificationController;

const createLeanQuery = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data),
});

const withUser = (allowedRoles = []) => (req, res, next) => {
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Admin',
    role: req.headers['x-test-role'] || 'admin',
  };

  if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role ${req.user.role} is not authorized` });
  }

  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/api/audit/admin/logs', withUser(['admin']), getAuditLogs);
  app.get('/api/audit/admin/stats', withUser(['admin']), getAuditStats);
  app.post('/api/notifications/admin', withUser(['admin']), createNotification);
  app.get('/api/notifications/inbox', withUser(), getInbox);
  app.patch('/api/notifications/receipts/:receiptId/read', withUser(), markAsRead);

  return app;
};

describe('Audit and notification API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns filtered audit logs with pagination metadata', async () => {
    vi.spyOn(AuditLog, 'find').mockReturnValue(createLeanQuery([
      {
        _id: 'audit-1',
        action: 'CREATE',
        entity: 'Student',
        description: 'Student created',
        module: 'admissions',
        status: 'success',
        performedBy: { name: 'Admin User', role: 'admin' },
        createdAt: '2026-06-13T00:00:00.000Z',
      },
    ]));
    vi.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1);

    const response = await request(createApp()).get('/api/audit/admin/logs?action=create&limit=20');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].entity).toBe('Student');
    expect(response.body.pagination.total).toBe(1);
  });

  it('returns audit stats for the admin center', async () => {
    vi.spyOn(AuditLog, 'aggregate')
      .mockResolvedValueOnce([{ total: 12, success: 10, warning: 1, failure: 1 }])
      .mockResolvedValueOnce([{ _id: 'CREATE', count: 6 }])
      .mockResolvedValueOnce([{ _id: 'notifications', count: 4 }])
      .mockResolvedValueOnce([{ _id: 'Notification', count: 4 }])
      .mockResolvedValueOnce([{ _id: { userId: 'u1', name: 'Admin User', role: 'admin' }, count: 5 }]);
    vi.spyOn(AuditLog, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const response = await request(createApp()).get('/api/audit/admin/stats');

    expect(response.status).toBe(200);
    expect(response.body.data.summary.total).toBe(12);
    expect(response.body.data.actions[0]._id).toBe('CREATE');
    expect(response.body.data.modules[0]._id).toBe('notifications');
  });

  it('creates and sends an admin notification campaign', async () => {
    vi.spyOn(notificationCenterService, 'createNotification').mockResolvedValue({ _id: 'notif-1', title: 'Weather advisory' });
    vi.spyOn(Notification, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
    vi.spyOn(notificationCenterService, 'dispatchNotification').mockResolvedValue({
      _id: 'notif-1',
      title: 'Weather advisory',
      status: 'sent',
      stats: { totalRecipients: 3 },
    });

    const response = await request(createApp())
      .post('/api/notifications/admin')
      .send({
        title: 'Weather advisory',
        message: 'Students should stay hydrated today.',
        type: 'weather',
        severity: 'medium',
        channels: ['in_app', 'email'],
        roles: ['student'],
        sendNow: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('queued');
    expect(notificationCenterService.createNotification).toHaveBeenCalled();
    expect(notificationCenterService.dispatchNotification).toHaveBeenCalled();
  });

  it('returns inbox notifications for the current user', async () => {
    vi.spyOn(NotificationReceipt, 'find').mockReturnValue(createLeanQuery([
      {
        _id: 'receipt-1',
        isRead: false,
        createdAt: '2026-06-13T00:00:00.000Z',
        notification: {
          _id: 'notif-1',
          title: 'Attendance reminder',
          message: 'Please submit attendance before 9 AM.',
          type: 'attendance',
          severity: 'info',
        },
      },
    ]));
    vi.spyOn(NotificationReceipt, 'countDocuments').mockResolvedValue(1);

    const response = await request(createApp())
      .get('/api/notifications/inbox')
      .set('x-test-role', 'teacher');

    expect(response.status).toBe(200);
    expect(response.body.unreadCount).toBe(1);
    expect(response.body.data[0].notification.title).toBe('Attendance reminder');
  });

  it('marks a notification receipt as read', async () => {
    vi.spyOn(notificationCenterService, 'markReceiptRead').mockResolvedValue({
      _id: 'receipt-1',
      isRead: true,
    });

    const response = await request(createApp())
      .patch('/api/notifications/receipts/receipt-1/read')
      .set('x-test-role', 'parent');

    expect(response.status).toBe(200);
    expect(response.body.data.isRead).toBe(true);
  });
});
