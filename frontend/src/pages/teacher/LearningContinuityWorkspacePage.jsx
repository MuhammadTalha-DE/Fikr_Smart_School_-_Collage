import { useEffect, useState } from 'react';
import { CloudSun, Workflow } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getTeacherLearningContinuityWorkspace } from '../../services/teacherWorkspaceService';

const LearningContinuityWorkspacePage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getTeacherLearningContinuityWorkspace();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading continuity workspace...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Teaching Resilience" title="Learning Continuity Workspace" subtitle="Follow remote, hybrid, and weather-triggered learning continuity from the teacher side with a clearer operational trail." meta={[`${data.summary.totalLogs || 0} total logs`, `${data.summary.remoteDays || 0} remote days`, `${data.summary.hybridDays || 0} hybrid days`, `${data.summary.averageScore || 0} average continuity score`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Workflow} label="Logs" value={data.summary.totalLogs || 0} helper="Teacher continuity events" tone="blue" />
          <DashboardStatCard icon={CloudSun} label="Remote Days" value={data.summary.remoteDays || 0} helper="Remote delivery recorded" tone="indigo" />
          <DashboardStatCard icon={CloudSun} label="Hybrid Days" value={data.summary.hybridDays || 0} helper="Hybrid delivery recorded" tone="amber" />
          <DashboardStatCard icon={Workflow} label="Weather Triggered" value={data.summary.weatherTriggeredDays || 0} helper="Weather-linked continuity actions" tone="emerald" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Workflow} title="Continuity Log Feed" subtitle="Recent resilience records across your classes" tone="blue" />
          <div className="space-y-3">
            {(data.logs || []).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-slate-950">{item.class?.name || 'Class'} {item.subject?.name ? `- ${item.subject.name}` : ''}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{item.deliveryMode}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Score {item.continuityScore || 0} | Lessons {item.lessonsCompleted || 0} | Resources {item.resourcesShared || 0}</p>
                <p className="mt-2 text-sm text-slate-600">{item.notes || 'No notes recorded.'}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default LearningContinuityWorkspacePage;
