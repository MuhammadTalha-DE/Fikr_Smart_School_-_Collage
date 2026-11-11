import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const hrPayrollService = require('../services/hrPayrollService');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const TeacherAttendance = require('../models/TeacherAttendance');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const createLeanQuery = (data) => ({
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data),
});

describe('hrPayrollService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds an admin overview from staff, attendance, notifications, and audit signals', async () => {
    vi.spyOn(User, 'find').mockReturnValue(createLeanQuery([
      {
        _id: 'user-admin',
        name: 'Admin User',
        username: 'admin01',
        email: 'admin@example.com',
        phone: '111',
        role: 'admin',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        _id: 'user-teacher',
        name: 'Teacher User',
        username: 'teacher01',
        email: 'teacher@example.com',
        phone: '222',
        role: 'teacher',
        createdAt: '2026-06-02T00:00:00.000Z',
      },
    ]));

    vi.spyOn(Teacher, 'find').mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          userId: 'user-teacher',
          subjects: ['Physics'],
          classes: [{ _id: 'class-1', name: 'Grade 9' }],
        },
      ]),
    });

    vi.spyOn(TeacherAttendance, 'find')
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue([
          { status: 'present', lateMinutes: 0, updatedAt: '2026-06-13T08:00:00.000Z' },
        ]),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue([
          { status: 'present', lateMinutes: 0 },
          { status: 'late', lateMinutes: 14 },
        ]),
      });

    vi.spyOn(TeacherAttendance, 'aggregate').mockResolvedValue([
      { _id: { date: '2026-06-12', status: 'present' }, count: 3 },
      { _id: { date: '2026-06-12', status: 'late' }, count: 1 },
    ]);

    vi.spyOn(Notification, 'find').mockReturnValue(createLeanQuery([
      { _id: 'notif-1', title: 'Staff advisory', sourceModule: 'notifications', status: 'sent' },
    ]));

    vi.spyOn(AuditLog, 'find').mockReturnValue(createLeanQuery([
      { _id: 'audit-1', action: 'CREATE', entity: 'Notification', module: 'notifications', status: 'success' },
    ]));

    const overview = await hrPayrollService.getAdminOverview();

    expect(overview.summary.totalStaff).toBe(2);
    expect(overview.summary.teachers).toBe(1);
    expect(overview.departmentBreakdown).toHaveLength(2);
    expect(overview.teacherAttendance.today.present).toBe(1);
    expect(overview.teacherAttendance.month.late).toBe(1);
    expect(overview.payrollWindow.payableStaff).toBe(2);
    expect(overview.recentSignals.notifications[0].title).toBe('Staff advisory');
  });
});
