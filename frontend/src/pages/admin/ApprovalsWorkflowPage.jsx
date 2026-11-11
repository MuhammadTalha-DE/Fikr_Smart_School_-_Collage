import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, Clock3, Workflow } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { applyApprovalWorkflowAction, getApprovalsWorkflow } from '../../services/adminOperationsService';

const tone = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
};

const ApprovalsWorkflowPage = () => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const response = await getApprovalsWorkflow();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const act = async (entityType, entityId, decision) => {
    try {
      await applyApprovalWorkflowAction({ entityType, entityId, decision, note: notes[entityId] || '' });
      toast.success(`Request ${decision}`);
      setNotes((current) => ({ ...current, [entityId]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update workflow item');
    }
  };

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading approvals workflow...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Workflow Control" title="Approvals Workflow Engine" subtitle="Review and action leave, purchase, gate pass, hostel, and clinic escalation decisions in one unified queue." meta={[`${data.summary.totalPending} pending`, `${data.summary.critical} high-priority items`, `${data.summary.byModule.hostel} hostel items`, `${data.summary.byModule.security} security items`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Clock3} label="Pending" value={data.summary.totalPending} helper="All pending actions" tone="blue" />
          <DashboardStatCard icon={Workflow} label="Hostel" value={data.summary.byModule.hostel} helper="Hostel access and leave flow" tone="amber" />
          <DashboardStatCard icon={BadgeCheck} label="Security" value={data.summary.byModule.security} helper="Gate pass approvals waiting action" tone="indigo" />
          <DashboardStatCard icon={Workflow} label="Clinic" value={data.summary.byModule.clinic} helper="Medical escalations needing leadership review" tone="rose" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Workflow} title="Approval Queue" subtitle="Cross-module decisions in a single operational view" tone="blue" />
          <div className="space-y-3">
            {(data.items || []).map((item) => (
              <div key={`${item.entityType}-${item.entityId}`} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{item.module}</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${tone[item.priority] || 'bg-slate-100 text-slate-700'}`}>{item.priority}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.subtitle}</p>
                    <p className="mt-1 text-xs text-slate-400">Requested by {item.requestedBy} on {new Date(item.requestedAt).toLocaleString()}</p>
                    {item.latestNote ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Latest note: {item.latestNote.actorRole} {item.latestNote.actionType}
                        {item.latestNote.note ? ` - ${item.latestNote.note}` : ''}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <textarea
                        value={notes[item.entityId] || ''}
                        onChange={(event) => setNotes((current) => ({ ...current, [item.entityId]: event.target.value }))}
                        placeholder="Add approval note, context, or follow-up instruction"
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => act(item.entityType, item.entityId, 'approved')} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Approve</button>
                    <button type="button" onClick={() => act(item.entityType, item.entityId, 'rejected')} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default ApprovalsWorkflowPage;
