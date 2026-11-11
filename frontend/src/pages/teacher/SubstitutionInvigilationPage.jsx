import { useEffect, useState } from 'react';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getTeacherSubstitutionCenter } from '../../services/teacherWorkspaceService';

const SubstitutionInvigilationPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getTeacherSubstitutionCenter();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading substitution center...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Duty Planning" title="Substitution & Invigilation Center" subtitle="Track substitute teaching assignments, invigilation duty, and upcoming exam exposure from one teacher operations page." meta={[`${data.summary.substitutions || 0} substitutions`, `${data.summary.invigilationDuties || 0} invigilation duties`, `${data.summary.upcomingExams || 0} relevant exams`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardStatCard icon={ClipboardList} label="Substitutions" value={data.summary.substitutions || 0} helper="Assigned or impacted substitutions" tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Invigilation" value={data.summary.invigilationDuties || 0} helper="Scheduled exam duty" tone="emerald" />
          <DashboardStatCard icon={ClipboardList} label="Upcoming Exams" value={data.summary.upcomingExams || 0} helper="Exam windows for your classes" tone="amber" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Substitution Feed" subtitle="Class cover and teacher availability shifts" tone="blue" />
            <div className="space-y-3">
              {(data.substitutions || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.classId?.name || 'Class'} | Period {item.period}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.date).toLocaleDateString()} | {item.status}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShieldCheck} title="Invigilation & Exam Feed" subtitle="Duty assignments and related exam windows" tone="emerald" />
            <div className="space-y-3">
              {(data.invigilationDuties || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.examId?.name || 'Invigilation Duty'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.classId?.name || item.roomLabel || 'Duty'} | {item.status}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.dutyDate).toLocaleDateString()} | {item.session}</p>
                </div>
              ))}
              {(data.relevantExams || []).slice(0, 4).map((item) => (
                <div key={item._id} className="rounded-3xl border border-dashed border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-950">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.classId?.name || 'Class'} | {new Date(item.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default SubstitutionInvigilationPage;
