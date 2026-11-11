import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HRPayrollDashboard from '../pages/admin/HRPayrollDashboard';

const mocks = vi.hoisted(() => ({
  getHRPayrollOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/hrPayrollService', () => ({
  getHRPayrollOverview: mocks.getHRPayrollOverview,
}));

describe('HRPayrollDashboard', () => {
  it('renders the dedicated admin HR & Payroll module surface', async () => {
    mocks.getHRPayrollOverview.mockResolvedValue({
      data: {
        data: {
          summary: { totalStaff: 18, teachers: 11, operationsStaff: 7, departments: 5 },
          teacherAttendance: { month: { percentage: 94, total: 22 } },
          payrollWindow: { monthLabel: 'June 2026', cycleStatus: 'attendance-ready', payableStaff: 18, attendanceBackedTeachers: 22 },
          departmentBreakdown: [{ department: 'Academics', total: 11, roles: { teacher: 11 } }],
          moduleReadiness: [{ key: 'staff-master', label: 'Staff master records', status: 'active' }],
          recentStaff: [{ _id: 'staff-1', name: 'Ayesha Khan', designation: 'Teacher', department: 'Academics', email: 'ayesha@example.com', phone: '123', role: 'teacher' }],
          recentSignals: {
            notifications: [{ _id: 'notif-1', title: 'Staff update', sourceModule: 'notifications', status: 'sent' }],
            audits: [{ _id: 'audit-1', action: 'CREATE', entity: 'Notification', module: 'notifications', status: 'success' }],
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <HRPayrollDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('HR & Payroll Command Center')).toBeInTheDocument());
    expect(screen.getByText('Department Coverage')).toBeInTheDocument();
    expect(screen.getByText('Newest Staff Records')).toBeInTheDocument();
  });
});
