import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { createCampusVisitor, getCampusVisitors, updateCampusVisitor } from '../../services/securityGateService';

const emptyForm = { visitorName: '', phone: '', idNumber: '', purpose: '', hostName: '', destination: '', vehicleNumber: '', status: 'checked_in' };

const SecurityVisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const response = await getCampusVisitors();
    setVisitors(response.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Users} title="Campus Visitors" subtitle="Register and update campus visitor entry and exit logs" tone="blue" />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createCampusVisitor(form);
                toast.success('Visitor entry created');
                setForm(emptyForm);
                await load();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Could not save visitor entry');
              }
            }}
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            {['visitorName', 'phone', 'idNumber', 'purpose', 'hostName', 'destination', 'vehicleNumber'].map((field) => (
              <input key={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            ))}
            <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Add Visitor</button>
          </form>
        </DashboardCard>
        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Purpose', 'Host', 'Destination', 'Status', 'Action'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map((visitor) => (
                  <tr key={visitor._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{visitor.visitorName}</td>
                    <td className="px-4 py-3">{visitor.purpose}</td>
                    <td className="px-4 py-3">{visitor.hostName || '—'}</td>
                    <td className="px-4 py-3">{visitor.destination || 'Campus'}</td>
                    <td className="px-4 py-3">{visitor.status}</td>
                    <td className="px-4 py-3">
                      {visitor.status === 'checked_in' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateCampusVisitor(visitor._id, { status: 'checked_out', exitTime: new Date().toISOString() });
                            toast.success('Visitor checked out');
                            await load();
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Check Out
                        </button>
                      ) : '—'}
                    </td>
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

export default SecurityVisitorsPage;
