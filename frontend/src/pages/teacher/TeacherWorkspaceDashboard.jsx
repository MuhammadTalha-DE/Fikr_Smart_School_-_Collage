import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, ClipboardList, Sparkles, UserCheck, Workflow } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getTeacherWorkspaceOverview } from '../../services/teacherWorkspaceService';

const TeacherWorkspaceDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getTeacherWorkspaceOverview();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading teacher workspace...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Teacher Operations"
          title="Teacher Workspace"
          subtitle="Move through HR self-service, lesson delivery, interventions, PTM planning, substitutions, and continuity from one teacher command surface."
          meta={[
            `${data.summary.attendanceRate || 0}% attendance`,
            `${data.summary.openInterventions || 0} open interventions`,
            `${data.summary.scheduledPTMs || 0} scheduled PTMs`,
            `${data.summary.activeSubstitutions || 0} substitution items`,
          ]}
          actions={(
            <>
              <DashboardQuickLink icon={UserCheck} label="Self-Service" to="/teacher/self-service" tone="blue" />
              <DashboardQuickLink icon={ClipboardList} label="Lesson Delivery" to="/teacher/lesson-delivery" tone="emerald" />
              <DashboardQuickLink icon={Workflow} label="Continuity" to="/teacher/learning-continuity" tone="amber" />
            </>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={UserCheck} label="Attendance" value={`${data.summary.attendanceRate || 0}%`} helper="Current month staff attendance" tone="blue" />
          <DashboardStatCard icon={ClipboardList} label="Interventions" value={data.summary.openInterventions || 0} helper="Students requiring follow-up" tone="amber" />
          <DashboardStatCard icon={CalendarDays} label="PTMs" value={data.summary.scheduledPTMs || 0} helper="Scheduled parent meetings" tone="indigo" />
          <DashboardStatCard icon={Workflow} label="Continuity" value={data.summary.continuityScoreAverage || 0} helper="Average continuity score" tone="emerald" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={BriefcaseBusiness} title="Workspace Modules" subtitle="Dedicated teacher surfaces now available" tone="blue" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ['Teacher HR Self-Service', '/teacher/self-service'],
                ['Lesson Delivery Tracker', '/teacher/lesson-delivery'],
                ['Student Intervention Tracker', '/teacher/interventions'],
                ['Parent Meeting / PTM Center', '/teacher/ptm-center'],
                ['Substitution & Invigilation', '/teacher/substitutions'],
                ['Learning Continuity Workspace', '/teacher/learning-continuity'],
              ].map(([label, to]) => (
                <DashboardQuickLink key={label} icon={Sparkles} label={label} to={to} tone="slate" />
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Recent Teacher Signals" subtitle="The latest requests and teaching workflow activity" tone="emerald" />
            <div className="space-y-3">
              {(data.leaveRequests || []).slice(0, 3).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.leaveType} leave</p>
                  <p className="mt-1 text-xs text-slate-500">{item.status}</p>
                </div>
              ))}
              {(data.ptms || []).slice(0, 2).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.topic}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.scheduledAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherWorkspaceDashboard;
