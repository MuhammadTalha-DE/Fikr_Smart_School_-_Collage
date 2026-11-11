import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AccountsDashboard from '../pages/admin/AccountsDashboard';

const mocks = vi.hoisted(() => ({
  getGeneralLedgerOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/generalLedgerService', () => ({
  getGeneralLedgerOverview: mocks.getGeneralLedgerOverview,
}));

describe('AccountsDashboard', () => {
  it('renders the dedicated accounts and ledger command center', async () => {
    mocks.getGeneralLedgerOverview.mockResolvedValue({
      data: {
        data: {
          summary: { totalAccounts: 16, postedVouchers: 8, totalIncome: 425000, totalExpense: 265000, hostelIncome: 90000, salaryExpense: 110000, bankBalance: 175000, cashBalance: 22000, transportIncome: 45000 },
          recentVouchers: [{ _id: 'voucher-1', voucherNumber: 'JV-1001', voucherType: 'journal', moduleSource: 'manual', book: 'general', narration: 'Opening entry', status: 'posted', totalDebit: 12000 }],
          statements: { netPosition: 160000, incomeAccounts: [{ _id: 'acc-1' }], expenseAccounts: [{ _id: 'acc-2' }] },
        },
      },
    });

    render(
      <MemoryRouter>
        <AccountsDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Accounts & General Ledger')).toBeInTheDocument());
    expect(screen.getByText('Recent Vouchers')).toBeInTheDocument();
    expect(screen.getByText('Statement Snapshot')).toBeInTheDocument();
  });
});
