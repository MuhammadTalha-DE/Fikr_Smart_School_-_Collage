import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import InventoryDashboard from '../pages/admin/InventoryDashboard';

const mocks = vi.hoisted(() => ({
  getInventoryOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/inventoryProcurementService', () => ({
  getInventoryOverview: mocks.getInventoryOverview,
}));

describe('InventoryDashboard', () => {
  it('renders the dedicated inventory and procurement command center', async () => {
    mocks.getInventoryOverview.mockResolvedValue({
      data: {
        data: {
          summary: { totalItems: 24, vendors: 6, pendingRequests: 3, openMaintenance: 2, lowStockItems: 4, activeOrders: 2, monthlySpend: 150000 },
          areaHighlights: { lab: 5, hostel: 4, libraryConsumables: 3, mainStore: 12 },
          lowStockItems: [{ _id: 'item-1', name: 'Printer Toner', sku: 'TON-01', location: 'library', category: 'library_consumable', currentStock: 2, unit: 'pcs', reorderLevel: 5 }],
          recentRequests: [{ _id: 'request-1', title: 'Lab chemicals', department: 'Science', priority: 'high', status: 'pending' }],
          recentOrders: [{ _id: 'order-1', poNumber: 'PO-1001', vendor: { name: 'Vendor A' }, totalAmount: 45000, status: 'issued' }],
          recentTransactions: [{ _id: 'tx-1', item: { name: 'Desk Chair' }, type: 'issue', area: 'admin', quantity: 4 }],
          maintenance: [{ _id: 'log-1', item: { name: 'Projector' }, issueType: 'Lamp replacement', severity: 'medium', status: 'open' }],
        },
      },
    });

    render(
      <MemoryRouter>
        <InventoryDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Inventory & Procurement Command Center')).toBeInTheDocument());
    expect(screen.getByText('Low Stock Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Area Coverage')).toBeInTheDocument();
  });
});
