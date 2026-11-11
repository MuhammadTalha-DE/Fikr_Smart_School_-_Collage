import { useEffect, useState } from 'react';
import { BriefcaseBusiness, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getPrincipalCommandCenter } from '../../services/adminOperationsService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const PrincipalCommandPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getPrincipalCommandCenter();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading principal command center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Leadership Command" title="Principal / Director Command Center" subtitle="A high-signal leadership view across people, finance, approvals, health, security, and campus operations." meta={[`${data.summary.students || 0} students`, `${data.summary.teachers || 0} teachers`, `${data.summary.pendingApprovals || 0} pending approvals`, `${money(data.summary.monthlyCollections)} monthly collections`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BriefcaseBusiness} label="Pending Approvals" value={data.summary.pendingApprovals || 0} helper={`${data.summary.staffPendingActions || 0} staff actions waiting`} tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Health Signals" value={data.summary.criticalHealthSignals || 0} helper="Leadership-level clinic escalations" tone="rose" />
          <DashboardStatCard icon={ShieldCheck} label="Security Signals" value={data.summary.securityAlerts || 0} helper="Active campus notices" tone="amber" />
          <DashboardStatCard icon={Sparkles} label="Collections" value={money(data.summary.monthlyCollections)} helper="Finance pulse this month" tone="emerald" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Sparkles} title="Leadership Signals" subtitle="Operational highlights for principal and director review" tone="amber" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(data.leadershipSignals || []).map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-black text-slate-950">{item.label}</p>
                <p className="mt-2 text-sm text-slate-600">{item.value}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default PrincipalCommandPage;
