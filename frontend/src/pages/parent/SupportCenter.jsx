import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, HeartPulse } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addParentWorkflowNote, getParentClinicAlerts, getParentInterventions } from '../../services/parentWorkflowService';

const ParentSupportCenter = () => {
  const [interventions, setInterventions] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const [interventionRes, clinicRes] = await Promise.all([getParentInterventions(), getParentClinicAlerts()]);
    setInterventions(interventionRes.data?.data || null);
    setClinic(clinicRes.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const addNote = async (entityType, entityId, actionType = 'note') => {
    try {
      await addParentWorkflowNote({ entityType, entityId, actionType, note: notes[entityId] || '' });
      toast.success('Workflow note added');
      setNotes((current) => ({ ...current, [entityId]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (!interventions || !clinic) {
    return <Layout role="parent"><div className="p-6 text-center text-slate-500">Loading support center...</div></Layout>;
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Student Support" title="Parent Support & Clinic Center" subtitle="Stay aligned on interventions, wellbeing concerns, and clinic alerts that involve your children." meta={[`${interventions.summary.open || 0} open interventions`, `${clinic.summary.open || 0} open clinic alerts`, `${clinic.summary.parentAlerted || 0} parent-alerted incidents`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={AlertTriangle} label="Interventions" value={interventions.summary.total || 0} helper={`${interventions.summary.open || 0} open support actions`} tone="amber" />
          <DashboardStatCard icon={HeartPulse} label="Clinic Alerts" value={clinic.summary.total || 0} helper={`${clinic.summary.open || 0} active incidents`} tone="rose" />
          <DashboardStatCard icon={AlertTriangle} label="Monitoring" value={interventions.summary.monitoring || 0} helper="Teacher support in progress" tone="indigo" />
          <DashboardStatCard icon={HeartPulse} label="Parent Alerted" value={clinic.summary.parentAlerted || 0} helper="Health incidents shared with family" tone="blue" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={AlertTriangle} title="Intervention Feed" subtitle="Teacher-raised support items for your children" tone="amber" />
            <div className="space-y-3">
              {(interventions.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category} | {item.status} | {item.priority}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.concern}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add parent context or follow-up note" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('student_intervention', item._id, 'follow_up')} className="mt-3 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">Add Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={HeartPulse} title="Clinic Alert Feed" subtitle="Recent health incidents linked to your children" tone="rose" />
            <div className="space-y-3">
              {(clinic.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.incidentType} | {item.severity} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.details}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add family response or clinic follow-up note" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('health_incident', item._id, 'follow_up')} className="mt-3 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Add Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default ParentSupportCenter;
