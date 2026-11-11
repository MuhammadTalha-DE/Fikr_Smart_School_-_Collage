import { useEffect, useState } from 'react';
import { BriefcaseBusiness, ClipboardCheck, FileText, HeartPulse, Landmark, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getAdminOperationsOverview } from '../../services/adminOperationsService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const AdminOperationsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getAdminOperationsOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading admin operations command center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Leadership Operations"
          title="Admin Operations Command Center"
          subtitle="Run budgeting, approvals, compliance, clinic and security oversight, staff self-service supervision, BI, and principal-level campus signals from one management module."
          meta={[
            `${overview?.summary?.pendingApprovals || 0} pending approvals`,
            `${overview?.summary?.budgetLines || 0} budget lines`,
            `${overview?.summary?.complianceItems || 0} compliance records`,
            `${money(overview?.summary?.monthlyCollections)} monthly collections`,
          ]}
          actions={(
            <>
              <DashboardQuickLink icon={Landmark} label="Budget Control" to="/admin/operations/budgeting" tone="blue" />
              <DashboardQuickLink icon={ClipboardCheck} label="Approvals" to="/admin/operations/approvals" tone="emerald" />
              <DashboardQuickLink icon={Sparkles} label="Principal Command" to="/admin/operations/principal-command" tone="amber" />
            </>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Landmark} label="Budget Lines" value={overview?.summary?.budgetLines || 0} helper="Finance control records active" tone="blue" />
          <DashboardStatCard icon={ClipboardCheck} label="Approvals" value={overview?.summary?.pendingApprovals || 0} helper="Cross-module decisions waiting action" tone="amber" />
          <DashboardStatCard icon={HeartPulse} label="Clinic Signals" value={overview?.summary?.criticalHealthSignals || 0} helper="Critical incidents requiring attention" tone="rose" />
          <DashboardStatCard icon={ShieldCheck} label="Security Signals" value={overview?.summary?.activeSecurityNotices || 0} helper="Active security notices" tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={BriefcaseBusiness} title="Module Readiness" subtitle="The admin gaps now surfaced as separate ERP workspaces" tone="blue" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ['Budget & Financial Control', '/admin/operations/budgeting'],
                ['Approvals Workflow Engine', '/admin/operations/approvals'],
                ['Document & Compliance', '/admin/operations/compliance'],
                ['Clinic Operations', '/admin/operations/clinic'],
                ['Security Operations', '/admin/operations/security'],
                ['Staff Self-Service Oversight', '/admin/operations/staff-oversight'],
                ['Management Reports / BI', '/admin/operations/bi-center'],
                ['Principal / Director Command', '/admin/operations/principal-command'],
              ].map(([label, to]) => (
                <DashboardQuickLink key={label} icon={Users} label={label} to={to} tone="slate" />
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={FileText} title="Principal Signals" subtitle="Campus leadership highlights flowing into the command layer" tone="amber" />
            <div className="space-y-3">
              {(overview?.principalSignals || []).map((signal) => (
                <div key={signal.label} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{signal.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{signal.value}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOperationsDashboard;
