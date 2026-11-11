import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { createTeacherPTMMeeting, getTeacherPTMCenter, getTeacherWorkspaceContext } from '../../services/teacherWorkspaceService';

const PTMCenterPage = () => {
  const [data, setData] = useState(null);
  const [context, setContext] = useState(null);
  const [form, setForm] = useState({ studentId: '', classId: '', topic: '', scheduledAt: '', mode: 'on_campus', parentName: '', notes: '' });

  const load = async () => {
    const [ptmRes, contextRes] = await Promise.all([getTeacherPTMCenter(), getTeacherWorkspaceContext()]);
    setData(ptmRes.data?.data || null);
    setContext(contextRes.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createTeacherPTMMeeting(form);
      toast.success('PTM meeting scheduled');
      setForm({ studentId: '', classId: '', topic: '', scheduledAt: '', mode: 'on_campus', parentName: '', notes: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule PTM');
    }
  };

  if (!data || !context) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading PTM center...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Parent Coordination" title="Parent Meeting / PTM Center" subtitle="Schedule and track parent meetings for follow-up, support, and academic alignment." meta={[`${data.summary.total || 0} total meetings`, `${data.summary.scheduled || 0} scheduled`, `${data.summary.completed || 0} completed`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={CalendarDays} label="Scheduled" value={data.summary.scheduled || 0} helper="Upcoming PTMs" tone="blue" />
          <DashboardStatCard icon={Users} label="Completed" value={data.summary.completed || 0} helper="Finished meetings" tone="emerald" />
          <DashboardStatCard icon={Users} label="Cancelled" value={data.summary.cancelled || 0} helper="Cancelled sessions" tone="rose" />
          <DashboardStatCard icon={Users} label="Students" value={(context.students || []).length} helper="Available for PTM planning" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={CalendarDays} title="Schedule PTM" subtitle="Create a new parent meeting slot" tone="blue" />
            <form onSubmit={submit} className="space-y-4">
              <select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">Select student</option>
                {(context.students || []).map((item) => <option key={item._id} value={item._id}>{item.userId?.name}</option>)}
              </select>
              <select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">Select class</option>
                {(context.classes || []).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              {['topic', 'scheduledAt', 'mode', 'parentName', 'notes'].map((field) => (
                <input key={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              ))}
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Schedule PTM</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Meeting Calendar Feed" subtitle="Teacher-owned PTM sessions and latest status" tone="emerald" />
            <div className="space-y-3">
              {(data.meetings || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.topic}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.studentId?.userId?.name || 'Student'} | {item.status}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.scheduledAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default PTMCenterPage;
