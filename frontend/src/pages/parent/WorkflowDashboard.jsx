import { useEffect, useState } from 'react';
import { CalendarDays, HeartPulse, ShieldCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getParentWorkflowOverview } from '../../services/parentWorkflowService';

const ParentWorkflowDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getParentWorkflowOverview();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="parent"><div className="p-6 text-center text-slate-500">Loading family workflow center...</div></Layout>;
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Family Workflow"
          title="Parent Collaboration Center"
          subtitle="Track PTMs, student support interventions, clinic alerts, and child security approvals from one parent-facing workflow hub."
          meta={[
            `${data.summary.children || 0} children`,
            `${data.summary.scheduledPTMs || 0} PTMs`,
            `${data.summary.openInterventions || 0} interventions`,
            `${data.summary.securityResponsesPending || 0} security responses pending`,
          ]}
          actions={(
            <>
              <DashboardQuickLink icon={CalendarDays} label="PTM Center" to="/parent/ptm-center" tone="blue" />
              <DashboardQuickLink icon={HeartPulse} label="Support & Clinic" to="/parent/support-center" tone="rose" />
              <DashboardQuickLink icon={ShieldCheck} label="Security Center" to="/parent/security-center" tone="amber" />
            </>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Children" value={data.summary.children || 0} helper="Linked family records" tone="blue" />
          <DashboardStatCard icon={CalendarDays} label="PTMs" value={data.summary.scheduledPTMs || 0} helper="Scheduled parent meetings" tone="indigo" />
          <DashboardStatCard icon={HeartPulse} label="Clinic Alerts" value={data.summary.clinicAlerts || 0} helper="Active child health signals" tone="rose" />
          <DashboardStatCard icon={ShieldCheck} label="Security" value={data.summary.securityResponsesPending || 0} helper="Gate pass actions waiting family response" tone="amber" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Users} title="Workflow Modules" subtitle="Cross-role workflows now visible inside the parent portal" tone="blue" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickLink icon={CalendarDays} label="PTM Center" to="/parent/ptm-center" tone="blue" />
            <DashboardQuickLink icon={HeartPulse} label="Support & Clinic" to="/parent/support-center" tone="rose" />
            <DashboardQuickLink icon={ShieldCheck} label="Security Center" to="/parent/security-center" tone="amber" />
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default ParentWorkflowDashboard;
