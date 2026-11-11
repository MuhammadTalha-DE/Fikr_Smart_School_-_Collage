import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ClipboardCheck, Wrench } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  createMaintenanceLog,
  getInventoryItems,
  getMaintenanceLogs,
  updateMaintenanceLog,
} from '../../services/inventoryProcurementService';

const initialForm = {
  item: '',
  issueType: '',
  severity: 'medium',
  status: 'open',
  assignedToName: '',
  scheduledDate: '',
  notes: '',
};

const InventoryMaintenancePage = () => {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    const [itemRes, logRes] = await Promise.all([
      getInventoryItems(),
      getMaintenanceLogs(),
    ]);
    setItems(itemRes.data?.data || []);
    setLogs(logRes.data?.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitLog = async (event) => {
    event.preventDefault();
    try {
      const response = await createMaintenanceLog({
        ...form,
        scheduledDate: form.scheduledDate || null,
      });
      toast.success(response.data?.message || 'Maintenance log created successfully.');
      setForm(initialForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create the maintenance log right now.');
    }
  };

  const changeStatus = async (log, status) => {
    try {
      const response = await updateMaintenanceLog(log._id, {
        issueType: log.issueType,
        severity: log.severity,
        status,
        assignedToName: log.assignedToName || '',
        scheduledDate: log.scheduledDate || null,
        notes: log.notes || '',
      });
      toast.success(response.data?.message || 'Maintenance log updated successfully.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update maintenance status.');
    }
  };

  const openCount = logs.filter((item) => item.status !== 'resolved').length;

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={Wrench} label="Maintenance Logs" value={logs.length} helper="Total asset maintenance records" tone="amber" />
          <DashboardStatCard icon={AlertTriangle} label="Open Cases" value={openCount} helper="Cases still waiting on closure" tone="rose" />
          <DashboardStatCard icon={ClipboardCheck} label="Resolved" value={logs.filter((item) => item.status === 'resolved').length} helper="Completed maintenance activity" tone="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Wrench} title="Create Maintenance Log" subtitle="Track school asset repair and upkeep with clear case history" tone="amber" />
            <form onSubmit={submitLog} className="space-y-3">
              <select value={form.item} onChange={(event) => setForm((current) => ({ ...current, item: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" required>
                <option value="">Select asset or tracked item</option>
                {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              <input value={form.issueType} onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value }))} placeholder="Issue type" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" required />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['low', 'medium', 'high', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['open', 'in_progress', 'resolved'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input type="date" value={form.scheduledDate} onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <input value={form.assignedToName} onChange={(event) => setForm((current) => ({ ...current, assignedToName: event.target.value }))} placeholder="Assigned technician or staff" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Maintenance notes" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="submit" className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white">Create maintenance log</button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardCheck} title="Maintenance Tracker" subtitle="Update case status directly with clear admin feedback" tone="indigo" />
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{log.item?.name || 'Asset item'}</p>
                      <p className="mt-1 text-xs text-slate-500">{log.issueType} | {log.severity} severity</p>
                      <p className="mt-1 text-xs text-slate-400">{log.assignedToName || 'No assignee'} {log.scheduledDate ? `| ${new Date(log.scheduledDate).toLocaleDateString()}` : ''}</p>
                    </div>
                    <select value={log.status} onChange={(event) => changeStatus(log, event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                      {['open', 'in_progress', 'resolved'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {!logs.length ? <div className="py-10 text-center text-sm text-slate-500">No maintenance logs are recorded yet.</div> : null}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryMaintenancePage;
