import { useEffect, useState } from 'react';
import {
  BookOpenText,
  Building2,
  HandCoins,
  Landmark,
  ReceiptText,
  ScrollText,
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
import { getGeneralLedgerOverview } from '../../services/generalLedgerService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const AccountsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getGeneralLedgerOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading accounts command center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Finance Operations"
          title="Accounts & General Ledger"
          subtitle="Run income and expense ledgers, vouchers, cash and bank books, hostel and transport income, payroll expense, and core financial statements from a dedicated finance module."
          meta={[
            `${overview?.summary?.totalAccounts || 0} ledger accounts`,
            `${overview?.summary?.postedVouchers || 0} posted vouchers`,
            `${money(overview?.summary?.totalIncome)} income`,
            `${money(overview?.summary?.totalExpense)} expense`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={BookOpenText} label="Chart of Accounts" to="/admin/accounts-ledger/accounts" tone="blue" />
              <DashboardQuickLink icon={ReceiptText} label="Vouchers" to="/admin/accounts-ledger/vouchers" tone="emerald" />
              <DashboardQuickLink icon={ScrollText} label="Statements" to="/admin/accounts-ledger/statements" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={HandCoins} label="Income" value={money(overview?.summary?.totalIncome)} helper={`Hostel ${money(overview?.summary?.hostelIncome)}`} tone="emerald" />
          <DashboardStatCard icon={Landmark} label="Expense" value={money(overview?.summary?.totalExpense)} helper={`Salary ${money(overview?.summary?.salaryExpense)}`} tone="rose" />
          <DashboardStatCard icon={Building2} label="Bank Book" value={money(overview?.summary?.bankBalance)} helper={`Cash ${money(overview?.summary?.cashBalance)}`} tone="indigo" />
          <DashboardStatCard icon={ReceiptText} label="Transport Income" value={money(overview?.summary?.transportIncome)} helper="Fee-linked transport collection view" tone="blue" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ReceiptText} title="Recent Vouchers" subtitle="Latest postings across receipts, payments, journals, and contra" tone="blue" />
            {(overview?.recentVouchers || []).length ? (
              <div className="space-y-3">
                {overview.recentVouchers.map((voucher) => (
                  <div key={voucher._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{voucher.voucherNumber}</p>
                        <p className="mt-1 text-xs text-slate-500">{voucher.voucherType} | {voucher.moduleSource} | {voucher.book}</p>
                        <p className="mt-2 text-xs text-slate-500">{voucher.narration || 'No narration added.'}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{voucher.status}</span>
                        <p className="mt-2 text-sm font-black text-slate-950">{money(voucher.totalDebit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={ReceiptText} title="No vouchers posted yet" subtitle="Voucher activity will appear once finance entries begin flowing through the ledger." />
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ScrollText} title="Statement Snapshot" subtitle="Quick income statement and balance position" tone="amber" />
            <div className="space-y-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Net position</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{money(overview?.statements?.netPosition)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-950">Income Accounts</p>
                <p className="mt-1 text-xs text-slate-500">{overview?.statements?.incomeAccounts?.length || 0} heads carrying operational revenue</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-950">Expense Accounts</p>
                <p className="mt-1 text-xs text-slate-500">{overview?.statements?.expenseAccounts?.length || 0} heads tracking payroll and running cost</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default AccountsDashboard;
