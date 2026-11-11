import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, BellRing, Bus, CheckCircle2, ClipboardList, Send } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import {
  addTransportWorkflowNote,
  createTransportIncident,
  getTransportIncidentCenter,
} from '../../services/transportWorkflowService';

const initialForm = {
  title: '',
  category: 'delay',
  routeId: '',
  vehicleId: '',
  delayMinutes: 10,
  severity: 'medium',
  description: '',
};

const TransportIncidentCenter = () => {
  const [data, setData] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [incidentsRes, routesRes, vehiclesRes] = await Promise.all([
      getTransportIncidentCenter(),
      api.get('/transport/routes'),
      api.get('/transport/vehicles'),
    ]);

    setData(incidentsRes.data?.data || null);
    setRoutes(routesRes.data?.routes || []);
    setVehicles(vehiclesRes.data?.vehicles || []);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createTransportIncident(form);
      toast.success('Transport incident submitted for approval');
      setForm(initialForm);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit transport incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNote = async (id) => {
    try {
      await addTransportWorkflowNote({
        entityType: 'transport_incident',
        entityId: id,
        actionType: 'note',
        note: notes[id] || '',
      });
      toast.success('Workflow note added');
      setNotes((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (!data) {
    return <Layout role="transport"><div className="p-6 text-center text-slate-500">Loading incident center...</div></Layout>;
  }

  return (
    <Layout role="transport">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Transport Incidents"
          title="Incident & Delay Center"
          subtitle="Create structured transport events, move them into admin approval, and watch parent-notice status update as the workflow completes."
          meta={[
            `${data.summary.total || 0} requests`,
            `${data.summary.pendingApproval || 0} pending approval`,
            `${data.summary.parentNoticesSent || 0} parent notices sent`,
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={ClipboardList} label="Pending Approval" value={data.summary.pendingApproval || 0} helper="Awaiting admin review" tone="amber" />
          <DashboardStatCard icon={CheckCircle2} label="Approved" value={data.summary.approved || 0} helper="Accepted by admin workflow" tone="emerald" />
          <DashboardStatCard icon={BellRing} label="Notified" value={data.summary.notified || 0} helper="Parent notice dispatched" tone="sky" />
          <DashboardStatCard icon={AlertTriangle} label="Rejected" value={data.summary.rejected || 0} helper="Needs revision or closure" tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Send} title="Submit New Incident" subtitle="Route the request into admin approvals with all key transport details" tone="blue" />
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Title"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="delay">Delay</option>
                  <option value="incident">Incident</option>
                  <option value="route_change">Route Change</option>
                  <option value="vehicle_issue">Vehicle Issue</option>
                </select>
                <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">Select route</option>
                  {routes.map((route) => <option key={route._id} value={route._id}>{route.name}</option>)}
                </select>
                <select value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.registrationNumber}</option>)}
                </select>
              </div>
              <input
                type="number"
                min="0"
                value={form.delayMinutes}
                onChange={(event) => setForm((current) => ({ ...current, delayMinutes: Number(event.target.value) }))}
                placeholder="Estimated delay"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                placeholder="Describe the situation, route risk, or driver advisory"
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <button type="submit" disabled={submitting || (!form.routeId && !form.vehicleId)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Bus} title="Incident Workflow Queue" subtitle="Track approval, note history, and parent-notice dispatch status" tone="indigo" />
            <div className="space-y-3">
              {(data.items || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category} | {item.routeId?.name || 'Shared route'} | {item.vehicleId?.registrationNumber || 'No vehicle selected'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Severity: {item.severity} | Delay: {item.delayMinutes || 0} min | Notice: {item.parentNoticeStatus}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className={`rounded-full px-3 py-1 ${item.status === 'notified' ? 'bg-sky-100 text-sky-700' : item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {item.noteCount || 0} notes
                      </span>
                    </div>
                  </div>
                  {item.description ? <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p> : null}
                  {item.approvalNote ? <p className="mt-2 text-xs text-slate-500">Admin note: {item.approvalNote}</p> : null}
                  {item.latestNote?.note ? <p className="mt-1 text-xs text-slate-400">Latest workflow note: {item.latestNote.note}</p> : null}
                  <textarea
                    value={notes[item._id] || ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))}
                    rows={2}
                    placeholder="Add transport operations context"
                    className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <button type="button" onClick={() => handleNote(item._id)} className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                    Add Note
                  </button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default TransportIncidentCenter;
