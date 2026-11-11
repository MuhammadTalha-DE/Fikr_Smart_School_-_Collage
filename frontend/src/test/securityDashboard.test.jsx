import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SecurityGateDashboard from '../pages/admin/SecurityGateDashboard';

const mocks = vi.hoisted(() => ({
  getSecurityGateOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/securityGateService', () => ({
  getSecurityGateOverview: mocks.getSecurityGateOverview,
}));

describe('SecurityGateDashboard', () => {
  it('renders the dedicated security command center', async () => {
    mocks.getSecurityGateOverview.mockResolvedValue({
      data: {
        data: {
          summary: { activeVisitors: 3, pendingStudentPasses: 2, pendingStaffPasses: 1, activeSecurityNotices: 2, lockdownNotices: 1 },
          visitors: [{ _id: 'visitor-1', visitorName: 'Mr. Ahmed', purpose: 'Parent meeting', destination: 'Admin block', status: 'checked_in' }],
          notices: [{ _id: 'notice-1', title: 'Main gate watch', noticeType: 'security', message: 'Extra verification in progress.', status: 'active' }],
        },
      },
    });

    render(
      <MemoryRouter>
        <SecurityGateDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Gate Pass & Security Command Center')).toBeInTheDocument());
    expect(screen.getByText('Visitor Entry Feed')).toBeInTheDocument();
    expect(screen.getAllByText('Security Notices').length).toBeGreaterThan(0);
  });
});
