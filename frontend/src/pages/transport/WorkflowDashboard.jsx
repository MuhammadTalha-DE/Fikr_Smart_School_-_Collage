import { useEffect, useState } from 'react';
import { BellRing, Bus, CheckCircle2, ShieldCheck, Workflow } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getTransportWorkflowOverview } from '../../services/transportWorkflowService';

const TransportWorkflowDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getTransportWorkflowOverview();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="transport"><div className="p-6 text-center text-slate-500">Loading transport workflow center...</div></Layout>;
  }

  return (
    <Layout role="transport">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Transport Workflow"
          title="Transport Workflow Center"
          subtitle="Submit route incidents, track admin approval, and confirm when parent-facing notices have moved through the ERP communication flow."
          meta={[
            `${data.summary.totalIncidents || 0} recent incidents`,
            `${data.summary.pendingApproval || 0} pending approval`,
            `${data.summary.parentNoticesSent || 0} parent notices sent`,
          ]}
          actions={<DashboardQuickLink icon={Workflow} label="Incident Center" to="/transport/incidents" tone="blue" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Workflow} label="Pending Approval" value={data.summary.pendingApproval || 0} helper="Waiting for admin review" tone="amber" />
          <DashboardStatCard icon={CheckCircle2} label="Approved" value={data.summary.approved || 0} helper="Reviewed and accepted requests" tone="emerald" />
          <DashboardStatCard icon={BellRing} label="Parent Notices" value={data.summary.parentNoticesSent || 0} helper="Approved notices already dispatched" tone="sky" />
          <DashboardStatCard icon={Bus} label="Critical" value={data.summary.critical || 0} helper="High-risk transport events" tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShieldCheck} title="Recent Incident Flow" subtitle="Latest transport requests moving through approval and parent notice stages" tone="blue" />
            <div className="space-y-3">
              {(data.recentIncidents || []).length ? (
                data.recentIncidents.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.category} | {item.severity} | notice: {item.parentNoticeStatus}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                  No transport workflow incidents recorded yet.
                </div>
              )}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={BellRing} title="Recent Parent-Facing Notices" subtitle="Last dispatches created by approved transport workflow actions" tone="sky" />
            <div className="space-y-3">
              {(data.recentNotifications || []).length ? (
                data.recentNotifications.map((notice) => (
                  <div key={notice._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-black text-slate-950">{notice.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{notice.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                  Parent notices will appear here after the first approved incident.
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default TransportWorkflowDashboard;
