import { useEffect, useState } from 'react';
import { Boxes, FileBarChart2, ShoppingCart, Wrench } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getInventoryOverview } from '../../services/inventoryProcurementService';

const InventoryReportsPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await getInventoryOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="p-6 text-center text-slate-500">Loading inventory reports...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DashboardStatCard icon={Boxes} label="Total Items" value={overview?.summary?.totalItems || 0} helper="All tracked inventory records" tone="blue" />
          <DashboardStatCard icon={ShoppingCart} label="Monthly Spend" value={`PKR ${(overview?.summary?.monthlySpend || 0).toLocaleString()}`} helper="Purchase order volume in the current month" tone="emerald" />
          <DashboardStatCard icon={Wrench} label="Open Maintenance" value={overview?.summary?.openMaintenance || 0} helper="Assets still needing support" tone="amber" />
          <DashboardStatCard icon={FileBarChart2} label="Low Stock" value={overview?.summary?.lowStockItems || 0} helper="Replenishment watchlist count" tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Boxes} title="Inventory By Location" subtitle="Where school stock is currently distributed" tone="blue" />
            <div className="space-y-3">
              {(overview?.inventoryByLocation || []).map((entry) => (
                <div key={entry.location} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{entry.location}</p>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{entry.quantity} units</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShoppingCart} title="Inventory By Category" subtitle="Category mix across operations, assets, and consumables" tone="violet" />
            <div className="space-y-3">
              {(overview?.inventoryByCategory || []).map((entry) => (
                <div key={entry.category} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{entry.category}</p>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase text-violet-700">{entry.quantity} units</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Wrench} title="Operational Snapshot" subtitle="What the module now reports clearly for admin decision-making" tone="amber" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Procurement</p>
              <p className="mt-2 text-sm text-slate-700">{overview?.summary?.pendingRequests || 0} pending requests and {overview?.summary?.activeOrders || 0} active purchase orders.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Inventory risk</p>
              <p className="mt-2 text-sm text-slate-700">{overview?.summary?.lowStockItems || 0} items are under reorder pressure across the campus supply chain.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Asset support</p>
              <p className="mt-2 text-sm text-slate-700">{overview?.summary?.openMaintenance || 0} maintenance cases remain open inside the asset log.</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default InventoryReportsPage;
