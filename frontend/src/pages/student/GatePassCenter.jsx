import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock3, ShieldCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addStudentWorkflowNote, getStudentGatePassCenter } from '../../services/studentWorkflowService';

const StudentGatePassCenter = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getStudentGatePassCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const addNote = async (id) => {
    try {
      await addStudentWorkflowNote({
        entityType: 'student_gate_pass',
        entityId: id,
        actionType: 'note',
        note: notes[id] || '',
      });
      toast.success('Gate pass note added');
      setNotes((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (!data) {
    return <Layout role="student"><div className="p-6 text-center text-slate-500">Loading gate-pass tracker...</div></Layout>;
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Security"
          title="Gate Pass Tracker"
          subtitle="Track security approval, parent response visibility, and the latest workflow notes around your gate-pass requests."
          meta={[
            `${data.summary.total || 0} requests`,
            `${data.summary.pendingApproval || 0} pending security approval`,
            `${data.summary.parentPending || 0} awaiting parent response`,
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={ShieldCheck} label="Total Requests" value={data.summary.total || 0} helper="Gate-pass history" tone="indigo" />
          <DashboardStatCard icon={Clock3} label="Pending Approval" value={data.summary.pendingApproval || 0} helper="Waiting for security/admin action" tone="amber" />
          <DashboardStatCard icon={Users} label="Parent Pending" value={data.summary.parentPending || 0} helper="Still awaiting guardian response" tone="blue" />
          <DashboardStatCard icon={CheckCircle2} label="Approved" value={data.summary.approved || 0} helper="Approved pass requests" tone="emerald" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={ShieldCheck} title="Request Timeline" subtitle="See security status and family visibility together" tone="amber" />
          <div className="space-y-3">
            {(data.items || []).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.passType.replace('_', ' ')}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Exit: {new Date(item.exitTime).toLocaleString()}
                      {item.returnTime ? ` | Return: ${new Date(item.returnTime).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className={`rounded-full px-3 py-1 ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${item.parentResponseStatus === 'approved' ? 'bg-blue-100 text-blue-700' : item.parentResponseStatus === 'declined' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      Parent: {item.parentResponseStatus}
                    </span>
                  </div>
                </div>
                {item.parentResponseNote ? <p className="mt-2 text-xs text-slate-500">Parent note: {item.parentResponseNote}</p> : null}
                {item.latestNote?.note ? <p className="mt-1 text-xs text-slate-400">Latest workflow note: {item.latestNote.note}</p> : null}
                <textarea
                  value={notes[item._id] || ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))}
                  rows={2}
                  placeholder="Add a student note for security or your family"
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs"
                />
                <button type="button" onClick={() => addNote(item._id)} className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                  Add Note
                </button>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default StudentGatePassCenter;
