import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addWardenWorkflowNote, getWardenPTMCenter } from '../../services/wardenWorkflowService';

const WardenPTMCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getWardenPTMCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const addNote = async (entityId) => {
    try {
      await addWardenWorkflowNote({ entityType: 'ptm_meeting', entityId, actionType: 'recommend', note: notes[entityId] || '' });
      toast.success('Warden note added');
      setNotes((current) => ({ ...current, [entityId]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (!data) {
    return <Layout role="warden"><div className="p-6 text-center text-slate-500">Loading PTM view...</div></Layout>;
  }

  return (
    <Layout role="warden">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Resident Meetings" title="Warden PTM View" subtitle="Monitor upcoming PTMs for hostel residents and add operational context where needed." meta={[`${data.summary.total || 0} meetings`, `${data.summary.scheduled || 0} scheduled`, `${data.summary.parentPending || 0} awaiting parent response`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={CalendarDays} label="Total" value={data.summary.total || 0} helper="Resident-linked PTM records" tone="blue" />
          <DashboardStatCard icon={CalendarDays} label="Scheduled" value={data.summary.scheduled || 0} helper="Upcoming meetings" tone="emerald" />
          <DashboardStatCard icon={CalendarDays} label="Parent Pending" value={data.summary.parentPending || 0} helper="Awaiting family response" tone="amber" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={CalendarDays} title="PTM Feed" subtitle="Resident-focused PTM visibility for hostel operations" tone="blue" />
          <div className="space-y-3">
            {(data.items || []).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-black text-slate-950">{item.topic}</p>
                <p className="mt-1 text-xs text-slate-500">{item.studentId?.userId?.name || 'Student'} | {item.parentResponseStatus} | {item.status}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(item.scheduledAt).toLocaleString()}</p>
                <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add hostel context for teacher/admin visibility" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                <button type="button" onClick={() => addNote(item._id)} className="mt-3 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">Add Warden Note</button>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default WardenPTMCenter;
