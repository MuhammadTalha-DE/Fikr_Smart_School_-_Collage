import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import StudentWorkflowDashboard from '../pages/student/WorkflowDashboard';

const mocks = vi.hoisted(() => ({
  getStudentWorkflowOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/studentWorkflowService', () => ({
  getStudentWorkflowOverview: mocks.getStudentWorkflowOverview,
}));

describe('StudentWorkflowDashboard', () => {
  it('renders the student workflow center', async () => {
    mocks.getStudentWorkflowOverview.mockResolvedValue({
      data: {
        data: {
          student: { name: 'Areeba' },
          summary: { scheduledPTMs: 2, gatePasses: 1, transportNotices: 1, pendingParentResponses: 1, gatePassParentPending: 1 },
          recentTransportNotices: [],
        },
      },
    });

    render(<MemoryRouter><StudentWorkflowDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Student Workflow Center')).toBeInTheDocument());
    expect(screen.getByText('Workflow Modules')).toBeInTheDocument();
  });
});
