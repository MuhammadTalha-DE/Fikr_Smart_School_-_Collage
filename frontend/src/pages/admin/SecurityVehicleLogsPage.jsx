import { useEffect, useState } from 'react';
import { CarFront } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { createVehicleGateLog, getVehicleGateLogs } from '../../services/securityGateService';

const emptyForm = { vehicleNumber: '', driverName: '', vehicleType: '', purpose: '', direction: 'entry', remarks: '' };

const SecurityVehicleLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const response = await getVehicleGateLogs();
    setLogs(response.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={CarFront} title="Vehicle Gate Logs" subtitle="Track school and external vehicle movement at the gate" tone="amber" />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createVehicleGateLog(form);
                toast.success('Vehicle gate log created');
                setForm(emptyForm);
                await load();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Could not save vehicle log');
              }
            }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {['vehicleNumber', 'driverName', 'vehicleType', 'purpose', 'remarks'].map((field) => (
              <input key={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            ))}
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['entry', 'exit'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="submit" className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-700">Add Vehicle Log</button>
          </form>
        </DashboardCard>
        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Vehicle', 'Driver', 'Type', 'Purpose', 'Direction', 'Logged At'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.vehicleNumber}</td>
                    <td className="px-4 py-3">{item.driverName || '—'}</td>
                    <td className="px-4 py-3">{item.vehicleType || '—'}</td>
                    <td className="px-4 py-3">{item.purpose || '—'}</td>
                    <td className="px-4 py-3">{item.direction}</td>
                    <td className="px-4 py-3">{item.loggedAt ? new Date(item.loggedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default SecurityVehicleLogsPage;
