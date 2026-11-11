import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TeacherWorkspaceDashboard from '../pages/teacher/TeacherWorkspaceDashboard';

const mocks = vi.hoisted(() => ({
  getTeacherWorkspaceOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/teacherWorkspaceService', () => ({
  getTeacherWorkspaceOverview: mocks.getTeacherWorkspaceOverview,
}));

describe('TeacherWorkspaceDashboard', () => {
  it('renders the teacher workspace dashboard', async () => {
    mocks.getTeacherWorkspaceOverview.mockResolvedValue({
      data: {
        data: {
          summary: { attendanceRate: 92, openInterventions: 3, scheduledPTMs: 2, activeSubstitutions: 1, continuityScoreAverage: 68 },
          leaveRequests: [{ _id: 'leave-1', leaveType: 'casual', status: 'pending' }],
          ptms: [{ _id: 'ptm-1', topic: 'Academic follow-up', scheduledAt: '2026-06-14T10:00:00.000Z' }],
        },
      },
    });

    render(<MemoryRouter><TeacherWorkspaceDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Teacher Workspace')).toBeInTheDocument());
    expect(screen.getByText('Workspace Modules')).toBeInTheDocument();
    expect(screen.getByText('Recent Teacher Signals')).toBeInTheDocument();
  });
});
