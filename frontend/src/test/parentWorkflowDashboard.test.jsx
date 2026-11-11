import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ParentWorkflowDashboard from '../pages/parent/WorkflowDashboard';

const mocks = vi.hoisted(() => ({
  getParentWorkflowOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/parentWorkflowService', () => ({
  getParentWorkflowOverview: mocks.getParentWorkflowOverview,
}));

describe('ParentWorkflowDashboard', () => {
  it('renders the parent collaboration center', async () => {
    mocks.getParentWorkflowOverview.mockResolvedValue({
      data: {
        data: {
          summary: { children: 2, scheduledPTMs: 1, openInterventions: 2, clinicAlerts: 1, securityResponsesPending: 1 },
        },
      },
    });

    render(<MemoryRouter><ParentWorkflowDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Parent Collaboration Center')).toBeInTheDocument());
    expect(screen.getByText('Workflow Modules')).toBeInTheDocument();
  });
});
