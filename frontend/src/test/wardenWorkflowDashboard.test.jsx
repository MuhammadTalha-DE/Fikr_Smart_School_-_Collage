import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WardenWorkflowDashboard from '../pages/warden/WorkflowDashboard';

const mocks = vi.hoisted(() => ({
  getWardenWorkflowOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/wardenWorkflowService', () => ({
  getWardenWorkflowOverview: mocks.getWardenWorkflowOverview,
}));

describe('WardenWorkflowDashboard', () => {
  it('renders the warden collaboration center', async () => {
    mocks.getWardenWorkflowOverview.mockResolvedValue({
      data: {
        data: {
          hostel: { _id: 'hostel-1', name: 'Iqbal Hostel' },
          summary: { residents: 84, scheduledPTMs: 3, openInterventions: 4, openClinicAlerts: 2, securityQueue: 5 },
        },
      },
    });

    render(<MemoryRouter><WardenWorkflowDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Warden Collaboration Center')).toBeInTheDocument());
    expect(screen.getByText('Collaboration Modules')).toBeInTheDocument();
  });
});
