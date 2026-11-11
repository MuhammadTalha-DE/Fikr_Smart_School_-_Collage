import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { createTeacherIntervention, getTeacherInterventions, getTeacherWorkspaceContext } from '../../services/teacherWorkspaceService';

const StudentInterventionTrackerPage = () => {
  const [data, setData] = useState(null);
  const [context, setContext] = useState(null);
  const [form, setForm] = useState({ studentId: '', classId: '', category: 'academic', priority: 'medium', concern: '', actionPlan: '', followUpDate: '' });

  const load = async () => {
    const [interventionRes, contextRes] = await Promise.all([getTeacherInterventions(), getTeacherWorkspaceContext()]);
    setData(interventionRes.data?.data || null);
    setContext(contextRes.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createTeacherIntervention(form);
      toast.success('Intervention created');
      setForm({ studentId: '', classId: '', category: 'academic', priority: 'medium', concern: '', actionPlan: '', followUpDate: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create intervention');
    }
  };

  if (!data || !context) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading intervention tracker...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Student Support" title="Student Intervention Tracker" subtitle="Record academic, attendance, behaviour, and wellbeing follow-up actions directly from the teacher portal." meta={[`${data.summary.total || 0} interventions`, `${data.summary.open || 0} open`, `${data.summary.monitoring || 0} monitoring`, `${data.summary.resolved || 0} resolved`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={AlertTriangle} label="Open" value={data.summary.open || 0} helper="Needs immediate action" tone="rose" />
          <DashboardStatCard icon={Users} label="Monitoring" value={data.summary.monitoring || 0} helper="Follow-up already in progress" tone="amber" />
          <DashboardStatCard icon={Users} label="Resolved" value={data.summary.resolved || 0} helper="Completed support actions" tone="emerald" />
          <DashboardStatCard icon={Users} label="Students" value={(context.students || []).length} helper="Available in teacher context" tone="blue" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={AlertTriangle} title="Create Intervention" subtitle="Register a concern and action plan" tone="blue" />
            <form onSubmit={submit} className="space-y-4">
              <select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">Select student</option>
                {(context.students || []).map((item) => <option key={item._id} value={item._id}>{item.userId?.name}</option>)}
              </select>
              <select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">Select class</option>
                {(context.classes || []).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              {['category', 'priority', 'concern', 'actionPlan', 'followUpDate'].map((field) => (
                <input key={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              ))}
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Create Intervention</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Intervention Feed" subtitle="Current teacher-owned support items" tone="emerald" />
            <div className="space-y-3">
              {(data.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category} | {item.priority} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.concern}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default StudentInterventionTrackerPage;
