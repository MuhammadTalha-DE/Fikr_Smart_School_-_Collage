import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addWardenWorkflowNote, getWardenSecurityCenter } from '../../services/wardenWorkflowService';

const WardenSecurityCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getWardenSecurityCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const addNote = async (entityType, entityId) => {
    try {
      await addWardenWorkflowNote({ entityType, entityId, actionType: 'recommend', note: notes[entityId] || '' });
      toast.success('Warden note added');
      setNotes((current) => ({ ...current, [entityId]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (!data) {
    return <Layout role="warden"><div className="p-6 text-center text-slate-500">Loading security workflow...</div></Layout>;
  }

  return (
    <Layout role="warden">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Resident Security" title="Warden Security Workflow" subtitle="Review hostel-linked gate-pass and visitor records with parent-response visibility and shared operational notes." meta={[`${data.summary.gatePasses || 0} gate passes`, `${data.summary.pendingPasses || 0} pending passes`, `${data.summary.pendingParentResponses || 0} pending parent responses`, `${data.summary.visitors || 0} visitors`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Lock} label="Gate Passes" value={data.summary.gatePasses || 0} helper="Resident security movement records" tone="blue" />
          <DashboardStatCard icon={Lock} label="Pending Passes" value={data.summary.pendingPasses || 0} helper="Still awaiting approval flow" tone="amber" />
          <DashboardStatCard icon={Lock} label="Parent Pending" value={data.summary.pendingParentResponses || 0} helper="Family response still pending" tone="rose" />
          <DashboardStatCard icon={Users} label="Visitors" value={data.summary.visitors || 0} helper="Hostel visitor activity" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Lock} title="Gate Pass Feed" subtitle="Resident pass flow with family response visibility" tone="amber" />
            <div className="space-y-3">
              {(data.gatePasses || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.passType} | {item.status} | Parent: {item.parentResponseStatus}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add hostel recommendation or concern" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('student_gate_pass', item._id)} className="mt-3 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">Add Warden Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Visitor Feed" subtitle="Hostel visitor approvals and movement notes" tone="indigo" />
            <div className="space-y-3">
              {(data.visitors || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.visitorName}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.hostelStudentId?.studentId?.userId?.name || 'Student'} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.purpose || 'No purpose noted.'}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add visitor workflow note" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('hostel_visitor', item._id)} className="mt-3 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Add Warden Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default WardenSecurityCenter;
