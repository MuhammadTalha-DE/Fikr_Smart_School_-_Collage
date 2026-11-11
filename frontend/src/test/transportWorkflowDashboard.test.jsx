import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TransportWorkflowDashboard from '../pages/transport/WorkflowDashboard';

const mocks = vi.hoisted(() => ({
  getTransportWorkflowOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/transportWorkflowService', () => ({
  getTransportWorkflowOverview: mocks.getTransportWorkflowOverview,
}));

describe('TransportWorkflowDashboard', () => {
  it('renders the transport workflow center', async () => {
    mocks.getTransportWorkflowOverview.mockResolvedValue({
      data: {
        data: {
          summary: { totalIncidents: 4, pendingApproval: 1, parentNoticesSent: 2, approved: 2, critical: 1 },
          recentIncidents: [],
          recentNotifications: [],
        },
      },
    });

    render(<MemoryRouter><TransportWorkflowDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Transport Workflow Center')).toBeInTheDocument());
    expect(screen.getByText('Recent Incident Flow')).toBeInTheDocument();
  });
});
