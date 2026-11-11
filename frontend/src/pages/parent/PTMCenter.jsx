import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getParentPTMCenter, respondToParentPTMMeeting } from '../../services/parentWorkflowService';

const ParentPTMCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getParentPTMCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const respond = async (id, responseStatus) => {
    try {
      await respondToParentPTMMeeting(id, { responseStatus, responseNote: notes[id] || '' });
      toast.success('PTM response saved');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save PTM response');
    }
  };

  if (!data) {
    return <Layout role="parent"><div className="p-6 text-center text-slate-500">Loading PTM center...</div></Layout>;
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Family Meetings" title="Parent PTM Center" subtitle="Confirm, reschedule, or decline parent meetings while keeping the teacher workflow aligned." meta={[`${data.summary.total || 0} total meetings`, `${data.summary.scheduled || 0} scheduled`, `${data.summary.parentPending || 0} awaiting your response`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={CalendarDays} label="Scheduled" value={data.summary.scheduled || 0} helper="Upcoming PTMs" tone="blue" />
          <DashboardStatCard icon={CheckCircle2} label="Pending Response" value={data.summary.parentPending || 0} helper="Waiting for parent confirmation" tone="amber" />
          <DashboardStatCard icon={CheckCircle2} label="Confirmed" value={data.summary.confirmed || 0} helper="Meetings already confirmed" tone="emerald" />
          <DashboardStatCard icon={CalendarDays} label="Total" value={data.summary.total || 0} helper="Parent-linked PTM history" tone="indigo" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={CalendarDays} title="Meeting Queue" subtitle="Respond to teacher-scheduled meetings for your children" tone="blue" />
          <div className="space-y-3">
            {(data.items || []).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-black text-slate-950">{item.topic}</p>
                <p className="mt-1 text-xs text-slate-500">{item.studentId?.userId?.name || 'Student'} | {item.classId?.name || 'Class'} | {item.status}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(item.scheduledAt).toLocaleString()} | Parent response: {item.parentResponseStatus}</p>
                {item.latestNote?.note ? <p className="mt-2 text-xs text-slate-500">Latest note: {item.latestNote.note}</p> : null}
                <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add confirmation, reschedule reason, or concern" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => respond(item._id, 'confirmed')} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Confirm</button>
                  <button type="button" onClick={() => respond(item._id, 'reschedule_requested')} className="rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">Request Reschedule</button>
                  <button type="button" onClick={() => respond(item._id, 'declined')} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default ParentPTMCenter;
