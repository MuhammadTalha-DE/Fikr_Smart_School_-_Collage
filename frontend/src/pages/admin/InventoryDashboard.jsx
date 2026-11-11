import { useEffect, useState } from 'react';
import {
  Boxes,
  ClipboardList,
  FileBarChart2,
  PackageOpen,
  ShoppingCart,
  Store,
  Truck,
  Wrench,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getInventoryOverview } from '../../services/inventoryProcurementService';

const InventoryDashboard = () => {
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
        <div className="p-6 text-center text-slate-500">Loading inventory command center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Operations"
          title="Inventory & Procurement Command Center"
          subtitle="Control stock, purchase requests, vendors, purchase orders, store issue and return activity, maintenance logs, and area-specific supplies for labs, hostel, and library from one modern admin module."
          meta={[
            `${overview?.summary?.totalItems || 0} tracked items`,
            `${overview?.summary?.vendors || 0} active vendors`,
            `${overview?.summary?.pendingRequests || 0} pending procurement requests`,
            `${overview?.summary?.openMaintenance || 0} open maintenance cases`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={PackageOpen} label="Stock Items" to="/admin/inventory/items" tone="blue" />
              <DashboardQuickLink icon={ShoppingCart} label="Procurement" to="/admin/inventory/procurement" tone="violet" />
              <DashboardQuickLink icon={Store} label="Store Ops" to="/admin/inventory/store" tone="emerald" />
              <DashboardQuickLink icon={Wrench} label="Maintenance" to="/admin/inventory/maintenance" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Boxes} label="Items" value={overview?.summary?.totalItems || 0} helper={`${overview?.summary?.lowStockItems || 0} below reorder level`} tone="blue" />
          <DashboardStatCard icon={Truck} label="Vendors" value={overview?.summary?.vendors || 0} helper={`${overview?.summary?.activeOrders || 0} active purchase orders`} tone="indigo" />
          <DashboardStatCard icon={ShoppingCart} label="Requests" value={overview?.summary?.pendingRequests || 0} helper="Pending and approved requests to process" tone="violet" />
          <DashboardStatCard icon={Wrench} label="Maintenance" value={overview?.summary?.openMaintenance || 0} helper={`PKR ${(overview?.summary?.monthlySpend || 0).toLocaleString()} monthly procurement spend`} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Low Stock Watchlist" subtitle="Items needing replenishment across school operations" tone="rose" />
            {(overview?.lowStockItems || []).length ? (
              <div className="space-y-3">
                {overview.lowStockItems.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.sku} | {item.location} | {item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-rose-700">{item.currentStock} {item.unit}</p>
                        <p className="text-[11px] text-slate-400">Reorder at {item.reorderLevel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={PackageOpen} title="No low-stock items" subtitle="Everything currently sits above reorder threshold." />
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Store} title="Area Coverage" subtitle="Where inventory is currently distributed" tone="emerald" />
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Lab inventory', overview?.areaHighlights?.lab || 0],
                ['Hostel inventory', overview?.areaHighlights?.hostel || 0],
                ['Library consumables', overview?.areaHighlights?.libraryConsumables || 0],
                ['Main store items', overview?.areaHighlights?.mainStore || 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShoppingCart} title="Recent Procurement" subtitle="Latest requests and orders flowing into the ERP" tone="violet" />
            <div className="space-y-4">
              {(overview?.recentRequests || []).slice(0, 4).map((request) => (
                <div key={request._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{request.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.department} | {request.priority} priority</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase text-violet-700">{request.status}</span>
                  </div>
                </div>
              ))}
              {(overview?.recentOrders || []).slice(0, 4).map((order) => (
                <div key={order._id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{order.poNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.vendor?.name || 'Vendor pending'} | PKR {(order.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Wrench} title="Transactions & Maintenance" subtitle="Store movement and asset support activity" tone="amber" />
            <div className="space-y-4">
              {(overview?.recentTransactions || []).slice(0, 4).map((entry) => (
                <div key={entry._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{entry.item?.name || 'Inventory item'}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.type} | {entry.area} | Qty {entry.quantity}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase text-amber-700">{entry.type}</span>
                  </div>
                </div>
              ))}
              {(overview?.maintenance || []).slice(0, 4).map((log) => (
                <div key={log._id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{log.item?.name || 'Asset'}</p>
                      <p className="mt-1 text-xs text-slate-500">{log.issueType} | {log.severity} severity</p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase text-rose-700">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={FileBarChart2} title="Reports Access" subtitle="Inventory analytics, procurement traceability, and operational stock reporting" tone="sky" action={<DashboardQuickLink icon={FileBarChart2} label="Open Reports" to="/admin/inventory/reports" tone="sky" />} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Inventory by location</p>
              <p className="mt-2 text-sm text-slate-700">Main store, lab, hostel, library, and admin areas are all separated for reporting.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Procurement trail</p>
              <p className="mt-2 text-sm text-slate-700">Requests, vendors, orders, and stock receipts now sit in one workflow chain.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Maintenance logs</p>
              <p className="mt-2 text-sm text-slate-700">Asset repair needs stay visible beside store and procurement activity.</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default InventoryDashboard;
