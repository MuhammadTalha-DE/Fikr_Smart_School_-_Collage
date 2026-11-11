import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Landmark, PiggyBank } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { createBudgetLine, getBudgetControlCenter } from '../../services/adminOperationsService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const BudgetControlPage = () => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ department: 'Academics', category: 'Operations', fiscalYear: new Date().getFullYear(), fiscalMonth: new Date().getMonth() + 1, allocatedAmount: '', committedAmount: '', spentAmount: '', notes: '' });

  const load = async () => {
    const response = await getBudgetControlCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createBudgetLine(form);
      toast.success('Budget line created');
      setForm({ department: 'Academics', category: 'Operations', fiscalYear: new Date().getFullYear(), fiscalMonth: new Date().getMonth() + 1, allocatedAmount: '', committedAmount: '', spentAmount: '', notes: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create budget line');
    }
  };

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading budget control center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Finance Control" title="Budgeting & Financial Control" subtitle="Plan budget lines by department and category, then monitor commitments, spend, and variance beside ledger signals." meta={[`${data.summary.totalBudgets} budget lines`, `${money(data.summary.allocatedAmount)} allocated`, `${money(data.summary.remainingAmount)} remaining`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={PiggyBank} label="Allocated" value={money(data.summary.allocatedAmount)} helper={`${data.summary.totalBudgets} active lines`} tone="blue" />
          <DashboardStatCard icon={Landmark} label="Committed" value={money(data.summary.committedAmount)} helper={`${money(data.summary.pendingPurchaseValue)} pending purchase value`} tone="amber" />
          <DashboardStatCard icon={Landmark} label="Spent" value={money(data.summary.spentAmount)} helper={`${data.summary.overrunBudgets} overrun budgets`} tone="rose" />
          <DashboardStatCard icon={PiggyBank} label="Remaining" value={money(data.summary.remainingAmount)} helper={`${data.summary.watchBudgets} budgets on watch`} tone="emerald" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Landmark} title="Create Budget Line" subtitle="Add a new monthly control line for leadership review" tone="blue" />
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['department', 'Department'],
                  ['category', 'Category'],
                  ['fiscalYear', 'Fiscal Year'],
                  ['fiscalMonth', 'Fiscal Month'],
                  ['allocatedAmount', 'Allocated Amount'],
                  ['committedAmount', 'Committed Amount'],
                  ['spentAmount', 'Spent Amount'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700">{label}</label>
                    <input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Notes</label>
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Save Budget Line</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={PiggyBank} title="Budget Watchlist" subtitle="Track utilization and remaining room by line" tone="emerald" />
            <div className="space-y-3">
              {(data.budgets || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.department} - {item.category}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.fiscalMonth}/{item.fiscalYear} | {item.status}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${item.statusSignal === 'overrun' ? 'bg-rose-100 text-rose-700' : item.statusSignal === 'watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.statusSignal}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500 md:grid-cols-4">
                    <p>Allocated: {money(item.allocatedAmount)}</p>
                    <p>Committed: {money(item.committedAmount)}</p>
                    <p>Spent: {money(item.spentAmount)}</p>
                    <p>Remaining: {money(item.remainingAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetControlPage;
