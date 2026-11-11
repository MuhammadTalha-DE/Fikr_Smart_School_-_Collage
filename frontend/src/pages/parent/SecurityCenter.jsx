import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addParentWorkflowNote, getParentSecurityCenter, respondToParentGatePass } from '../../services/parentWorkflowService';

const ParentSecurityCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getParentSecurityCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const respond = async (id, responseStatus) => {
    try {
      await respondToParentGatePass(id, { responseStatus, responseNote: notes[id] || '' });
      toast.success('Security response saved');
      setNotes((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save security response');
    }
  };

  const addVisitorNote = async (entityId) => {
    try {
      await addParentWorkflowNote({ entityType: 'hostel_visitor', entityId, actionType: 'note', note: notes[entityId] || '' });
      toast.success('Visitor note added');
      setNotes((current) => ({ ...current, [entityId]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add visitor note');
    }
  };

  if (!data) {
    return <Layout role="parent"><div className="p-6 text-center text-slate-500">Loading security center...</div></Layout>;
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Family Security" title="Parent Security Center" subtitle="Respond to student gate-pass requests and stay informed on hostel visitor activity tied to your children." meta={[`${data.summary.gatePasses || 0} gate passes`, `${data.summary.pendingParentResponses || 0} awaiting your response`, `${data.summary.visitors || 0} hostel visitor records`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={ShieldCheck} label="Gate Passes" value={data.summary.gatePasses || 0} helper="Child gate pass history" tone="blue" />
          <DashboardStatCard icon={Lock} label="Pending Responses" value={data.summary.pendingParentResponses || 0} helper="Waiting family input" tone="amber" />
          <DashboardStatCard icon={ShieldCheck} label="Approved Passes" value={data.summary.approvedPasses || 0} helper="Already cleared by admin" tone="emerald" />
          <DashboardStatCard icon={Users} label="Visitors" value={data.summary.visitors || 0} helper="Hostel visitor timeline" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Lock} title="Gate Pass Response Queue" subtitle="Approve, decline, or raise concern on child exit requests" tone="amber" />
            <div className="space-y-3">
              {(data.gatePasses || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.passType} | {item.status} | Parent: {item.parentResponseStatus}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add family note or concern" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => respond(item._id, 'approved')} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Approve</button>
                    <button type="button" onClick={() => respond(item._id, 'concern')} className="rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">Concern</button>
                    <button type="button" onClick={() => respond(item._id, 'declined')} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Hostel Visitor Feed" subtitle="Visitor flow linked to hostel-resident children" tone="indigo" />
            <div className="space-y-3">
              {(data.visitors || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.visitorName}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.hostelStudentId?.studentId?.userId?.name || 'Student'} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.purpose || 'No purpose noted.'}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add visitor note or concern" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addVisitorNote(item._id)} className="mt-3 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Add Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default ParentSecurityCenter;
