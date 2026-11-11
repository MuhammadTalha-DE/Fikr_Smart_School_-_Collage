import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, ClipboardList } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getTeacherLessonDeliveryTracker, recordTeacherLessonDelivery } from '../../services/teacherWorkspaceService';

const LessonDeliveryTrackerPage = () => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ lessonPlanId: '', deliveryMode: 'in_person', lessonsCompleted: 1, resourcesShared: 0, liveSessionsScheduled: 0, notes: '' });

  const load = async () => {
    const response = await getTeacherLessonDeliveryTracker();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await recordTeacherLessonDelivery(form);
      toast.success('Lesson delivery recorded');
      setForm({ lessonPlanId: '', deliveryMode: 'in_person', lessonsCompleted: 1, resourcesShared: 0, liveSessionsScheduled: 0, notes: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record lesson delivery');
    }
  };

  if (!data) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading lesson delivery tracker...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Teaching Workflow" title="Lesson Delivery Tracker" subtitle="Record what was delivered, mark linked plans complete, and keep continuity evidence flowing through the ERP." meta={[`${data.summary.totalPlans || 0} lesson plans`, `${data.summary.completedPlans || 0} completed`, `${data.summary.completionRate || 0}% completion rate`, `${data.summary.continuityLogs || 0} continuity logs`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BookOpen} label="Plans" value={data.summary.totalPlans || 0} helper="Tracked lesson plans" tone="blue" />
          <DashboardStatCard icon={BookOpen} label="Completed" value={data.summary.completedPlans || 0} helper="Marked complete from delivery flow" tone="emerald" />
          <DashboardStatCard icon={ClipboardList} label="Completion Rate" value={`${data.summary.completionRate || 0}%`} helper="Lesson completion ratio" tone="amber" />
          <DashboardStatCard icon={ClipboardList} label="Logs" value={data.summary.continuityLogs || 0} helper="Delivery evidence entries" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Record Delivery" subtitle="Create a delivery log against a lesson plan" tone="blue" />
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Lesson Plan</label>
                <select value={form.lessonPlanId} onChange={(event) => setForm({ ...form, lessonPlanId: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">Select a lesson plan</option>
                  {(data.plans || []).map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
                </select>
              </div>
              {['deliveryMode', 'lessonsCompleted', 'resourcesShared', 'liveSessionsScheduled', 'notes'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-700">{field}</label>
                  <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                </div>
              ))}
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Record Delivery</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={BookOpen} title="Recent Lesson Plans" subtitle="Most recent plans in the delivery flow" tone="emerald" />
            <div className="space-y-3">
              {(data.plans || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.class?.name || 'Class'} | {item.subject?.name || 'Subject'}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.isCompleted ? 'Completed' : 'Pending'}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default LessonDeliveryTrackerPage;
