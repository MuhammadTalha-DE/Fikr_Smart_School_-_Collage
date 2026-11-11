import { useEffect, useState } from 'react';
import { CalendarDays, HeartPulse, Lock, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getWardenWorkflowOverview } from '../../services/wardenWorkflowService';

const WardenWorkflowDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getWardenWorkflowOverview();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="warden"><div className="p-6 text-center text-slate-500">Loading resident workflow center...</div></Layout>;
  }

  return (
    <Layout role="warden">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Resident Workflow"
          title="Warden Collaboration Center"
          subtitle="Coordinate hostel-resident PTMs, interventions, clinic alerts, and security workflow from a single warden-facing operations page."
          meta={[
            `${data.hostel?.name || 'Assigned hostel'}`,
            `${data.summary.residents || 0} residents`,
            `${data.summary.openInterventions || 0} interventions`,
            `${data.summary.securityQueue || 0} security items`,
          ]}
          actions={(
            <>
              <DashboardQuickLink icon={CalendarDays} label="PTM View" to="/warden/ptm-center" tone="blue" />
              <DashboardQuickLink icon={HeartPulse} label="Support & Clinic" to="/warden/support-center" tone="rose" />
              <DashboardQuickLink icon={Lock} label="Security Workflow" to="/warden/security-center" tone="amber" />
            </>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Residents" value={data.summary.residents || 0} helper="Active hostel residents" tone="blue" />
          <DashboardStatCard icon={CalendarDays} label="PTMs" value={data.summary.scheduledPTMs || 0} helper="Resident-linked PTMs" tone="indigo" />
          <DashboardStatCard icon={HeartPulse} label="Clinic Alerts" value={data.summary.openClinicAlerts || 0} helper="Open health signals" tone="rose" />
          <DashboardStatCard icon={Lock} label="Security Queue" value={data.summary.securityQueue || 0} helper="Gate pass and visitor items" tone="amber" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Users} title="Collaboration Modules" subtitle="Cross-role workflow surfaces now available for warden operations" tone="blue" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickLink icon={CalendarDays} label="PTM View" to="/warden/ptm-center" tone="blue" />
            <DashboardQuickLink icon={HeartPulse} label="Support & Clinic" to="/warden/support-center" tone="rose" />
            <DashboardQuickLink icon={Lock} label="Security Workflow" to="/warden/security-center" tone="amber" />
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default WardenWorkflowDashboard;
