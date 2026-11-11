import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import { createSecurityNotice, getSecurityNotices, updateSecurityNotice } from '../../services/securityGateService';

const emptyForm = { title: '', message: '', noticeType: 'security', severity: 'medium', audience: ['admin', 'teacher'], status: 'active' };

const SecurityNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const response = await getSecurityNotices();
    setNotices(response.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Lock} title="Security Notices" subtitle="Publish security, visitor, lockdown, and emergency access notices" tone="rose" />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createSecurityNotice(form);
                toast.success('Security notice created');
                setForm(emptyForm);
                await load();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Could not save security notice');
              }
            }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice title" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <select value={form.noticeType} onChange={(e) => setForm({ ...form, noticeType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['security', 'lockdown', 'visitor', 'emergency'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['low', 'medium', 'high', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['draft', 'active', 'resolved'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="submit" className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700">Publish Notice</button>
          </form>
        </DashboardCard>
        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Title', 'Type', 'Severity', 'Status', 'Action'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.title}</td>
                    <td className="px-4 py-3">{item.noticeType}</td>
                    <td className="px-4 py-3">{item.severity}</td>
                    <td className="px-4 py-3">{item.status}</td>
                    <td className="px-4 py-3">
                      {item.status !== 'resolved' ? (
                        <button type="button" onClick={async () => { await updateSecurityNotice(item._id, { status: 'resolved' }); toast.success('Notice resolved'); await load(); }} className="text-blue-600 hover:text-blue-800">Resolve</button>
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

export default SecurityNoticesPage;
