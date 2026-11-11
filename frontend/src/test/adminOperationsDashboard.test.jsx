import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminOperationsDashboard from '../pages/admin/AdminOperationsDashboard';

const mocks = vi.hoisted(() => ({
  getAdminOperationsOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/adminOperationsService', () => ({
  getAdminOperationsOverview: mocks.getAdminOperationsOverview,
}));

describe('AdminOperationsDashboard', () => {
  it('renders the admin operations command center', async () => {
    mocks.getAdminOperationsOverview.mockResolvedValue({
      data: {
        data: {
          summary: { pendingApprovals: 5, budgetLines: 8, complianceItems: 3, criticalHealthSignals: 2, activeSecurityNotices: 1, monthlyCollections: 200000 },
          principalSignals: [{ label: 'Budget Health', value: '1 overrun / 2 on watch' }],
        },
      },
    });

    render(<MemoryRouter><AdminOperationsDashboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Admin Operations Command Center')).toBeInTheDocument());
    expect(screen.getByText('Module Readiness')).toBeInTheDocument();
    expect(screen.getByText('Principal Signals')).toBeInTheDocument();
  });
});
