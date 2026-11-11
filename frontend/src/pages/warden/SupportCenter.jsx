import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, HeartPulse } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { addWardenWorkflowNote, getWardenClinicAlerts, getWardenInterventions } from '../../services/wardenWorkflowService';

const WardenSupportCenter = () => {
  const [interventions, setInterventions] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const [interventionRes, clinicRes] = await Promise.all([getWardenInterventions(), getWardenClinicAlerts()]);
    setInterventions(interventionRes.data?.data || null);
    setClinic(clinicRes.data?.data || null);
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

  if (!interventions || !clinic) {
    return <Layout role="warden"><div className="p-6 text-center text-slate-500">Loading support center...</div></Layout>;
  }

  return (
    <Layout role="warden">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Resident Support" title="Warden Support & Clinic Center" subtitle="Watch interventions and health incidents for hostel residents, then add contextual hostel notes into the shared workflow." meta={[`${interventions.summary.open || 0} open interventions`, `${clinic.summary.open || 0} open clinic alerts`, `${clinic.summary.critical || 0} critical incidents`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={AlertTriangle} label="Interventions" value={interventions.summary.total || 0} helper={`${interventions.summary.open || 0} open support items`} tone="amber" />
          <DashboardStatCard icon={HeartPulse} label="Clinic Alerts" value={clinic.summary.total || 0} helper={`${clinic.summary.critical || 0} critical incidents`} tone="rose" />
          <DashboardStatCard icon={AlertTriangle} label="Monitoring" value={interventions.summary.monitoring || 0} helper="Ongoing support monitoring" tone="indigo" />
          <DashboardStatCard icon={HeartPulse} label="Open Health" value={clinic.summary.open || 0} helper="Active resident health issues" tone="blue" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={AlertTriangle} title="Intervention Feed" subtitle="Teacher-led support items affecting hostel residents" tone="amber" />
            <div className="space-y-3">
              {(interventions.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category} | {item.priority} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.concern}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add hostel context or operational note" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('student_intervention', item._id)} className="mt-3 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">Add Warden Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={HeartPulse} title="Clinic Alert Feed" subtitle="Resident health incidents with shared visibility" tone="rose" />
            <div className="space-y-3">
              {(clinic.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.incidentType} | {item.severity} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.details}</p>
                  <textarea value={notes[item._id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} rows={2} placeholder="Add hostel health note or living-condition context" className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs" />
                  <button type="button" onClick={() => addNote('health_incident', item._id)} className="mt-3 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Add Warden Note</button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default WardenSupportCenter;
