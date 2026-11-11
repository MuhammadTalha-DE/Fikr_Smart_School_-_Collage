import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Boxes, ClipboardList, Store } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  createInventoryTransaction,
  getInventoryItems,
  getInventoryTransactions,
} from '../../services/inventoryProcurementService';

const initialTransactionForm = {
  item: '',
  type: 'issue',
  area: 'main_store',
  quantity: 1,
  issuedTo: '',
  referenceType: '',
  notes: '',
};

const InventoryStoreOpsPage = () => {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialTransactionForm);

  const loadData = async () => {
    const [itemsRes, transactionRes] = await Promise.all([
      getInventoryItems(),
      getInventoryTransactions(),
    ]);
    setItems(itemsRes.data?.data || []);
    setTransactions(transactionRes.data?.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitTransaction = async (event) => {
    event.preventDefault();
    try {
      const response = await createInventoryTransaction(form);
      toast.success(response.data?.message || 'Store transaction recorded successfully.');
      setForm(initialTransactionForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to record the store transaction right now.');
    }
  };

  const totals = useMemo(() => ({
    issue: transactions.filter((entry) => entry.type === 'issue').length,
    return: transactions.filter((entry) => entry.type === 'return').length,
    receive: transactions.filter((entry) => entry.type === 'receive').length,
  }), [transactions]);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DashboardStatCard icon={Boxes} label="Items Ready" value={items.length} helper="Inventory records available for transactions" tone="blue" />
          <DashboardStatCard icon={ArrowRightLeft} label="Issues" value={totals.issue} helper="Store issues already recorded" tone="amber" />
          <DashboardStatCard icon={ArrowRightLeft} label="Returns" value={totals.return} helper="Stock returns recorded in the log" tone="emerald" />
          <DashboardStatCard icon={ClipboardList} label="Receipts" value={totals.receive} helper="Receive transactions improving stock levels" tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Store} title="Record Store Movement" subtitle="Issue, return, receive, consume, adjust, or mark maintenance usage with clear feedback" tone="emerald" />
            <form onSubmit={submitTransaction} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={form.item} onChange={(event) => setForm((current) => ({ ...current, item: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" required>
                  <option value="">Select inventory item</option>
                  {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['issue', 'return', 'receive', 'consume', 'adjustment', 'maintenance'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['main_store', 'lab', 'hostel', 'library', 'admin'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Quantity" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <input value={form.issuedTo} onChange={(event) => setForm((current) => ({ ...current, issuedTo: event.target.value }))} placeholder="Issued to / returned by" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <input value={form.referenceType} onChange={(event) => setForm((current) => ({ ...current, referenceType: event.target.value }))} placeholder="Reference type: lab, hostel, classroom, repair" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Notes for the store log" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Record store transaction</button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Recent Store Log" subtitle="Most recent item movements across store, lab, hostel, and library" tone="indigo" />
            <div className="space-y-3">
              {transactions.map((entry) => (
                <div key={entry._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{entry.item?.name || 'Inventory item'}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.type} | {entry.area} | Qty {entry.quantity}</p>
                      <p className="mt-1 text-xs text-slate-400">{entry.issuedTo || 'No person noted'} {entry.referenceType ? `| ${entry.referenceType}` : ''}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{entry.type}</span>
                  </div>
                </div>
              ))}
              {!transactions.length ? <div className="py-10 text-center text-sm text-slate-500">No store transactions have been recorded yet.</div> : null}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryStoreOpsPage;
