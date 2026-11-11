import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { getGeneralLedgerOverview } from '../../services/generalLedgerService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const LedgerStatementsPage = () => {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getGeneralLedgerOverview();
      setOverview(response.data?.data || null);
    };

    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={ScrollText} title="Financial Statements" subtitle="Income statement style view for operations and collections" tone="amber" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <h3 className="text-sm font-black text-slate-950">Income Accounts</h3>
              <div className="mt-4 space-y-3">
                {(overview?.statements?.incomeAccounts || []).map((account) => (
                  <div key={account._id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm text-slate-600">{account.name}</span>
                    <span className="text-sm font-black text-slate-950">{money(account.currentBalance)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <h3 className="text-sm font-black text-slate-950">Expense Accounts</h3>
              <div className="mt-4 space-y-3">
                {(overview?.statements?.expenseAccounts || []).map((account) => (
                  <div key={account._id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm text-slate-600">{account.name}</span>
                    <span className="text-sm font-black text-slate-950">{money(account.currentBalance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-3xl bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Net Position</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{money(overview?.statements?.netPosition)}</p>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default LedgerStatementsPage;
