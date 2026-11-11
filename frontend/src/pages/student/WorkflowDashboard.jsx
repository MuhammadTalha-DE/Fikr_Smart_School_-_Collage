import { useEffect, useState } from 'react';
import { CalendarDays, Bus, ShieldCheck, Workflow } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getStudentWorkflowOverview } from '../../services/studentWorkflowService';

const StudentWorkflowDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getStudentWorkflowOverview();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="student"><div className="p-6 text-center text-slate-500">Loading workflow center...</div></Layout>;
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Workflow"
          title="Student Workflow Center"
          subtitle="Stay aligned on PTMs, track gate-pass approvals, and keep transport notices visible from one student-facing operations view."
          meta={[
            `${data.student?.name || 'Student'}`,
            `${data.summary.scheduledPTMs || 0} PTMs`,
            `${data.summary.gatePasses || 0} gate passes`,
            `${data.summary.transportNotices || 0} transport notices`,
          ]}
          actions={(
            <>
              <DashboardQuickLink icon={CalendarDays} label="PTM Center" to="/student/ptm-center" tone="blue" />
              <DashboardQuickLink icon={ShieldCheck} label="Gate Pass Tracker" to="/student/gate-passes" tone="amber" />
            </>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={CalendarDays} label="Scheduled PTMs" value={data.summary.scheduledPTMs || 0} helper="Upcoming teacher-parent meetings" tone="blue" />
          <DashboardStatCard icon={Workflow} label="Parent Response Pending" value={data.summary.pendingParentResponses || 0} helper="PTMs waiting family action" tone="amber" />
          <DashboardStatCard icon={ShieldCheck} label="Gate Passes" value={data.summary.gatePasses || 0} helper={`${data.summary.gatePassParentPending || 0} waiting parent response`} tone="indigo" />
          <DashboardStatCard icon={Bus} label="Transport Notices" value={data.summary.transportNotices || 0} helper="Recent route and delay updates" tone="sky" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Workflow} title="Workflow Modules" subtitle="Dedicated student workflow surfaces now connected into the ERP flow" tone="blue" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DashboardQuickLink icon={CalendarDays} label="PTM Center" to="/student/ptm-center" tone="blue" />
              <DashboardQuickLink icon={ShieldCheck} label="Gate Pass Tracker" to="/student/gate-passes" tone="amber" />
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Bus} title="Recent Transport Notices" subtitle="The latest transport alerts sent directly into your workflow view" tone="sky" />
            <div className="space-y-3">
              {(data.recentTransportNotices || []).length ? (
                data.recentTransportNotices.map((notice) => (
                  <div key={notice._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-black text-slate-950">{notice.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{notice.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                  No transport workflow notices yet.
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default StudentWorkflowDashboard;
