import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, ShieldAlert } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { createComplianceRecord, getComplianceCenter } from '../../services/adminOperationsService';

const ComplianceCenterPage = () => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'policy', ownerRole: 'admin', linkedModule: 'system', dueDate: '', visibility: 'admin', summary: '' });

  const load = async () => {
    const response = await getComplianceCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createComplianceRecord(form);
      toast.success('Compliance document created');
      setForm({ title: '', category: 'policy', ownerRole: 'admin', linkedModule: 'system', dueDate: '', visibility: 'admin', summary: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create document');
    }
  };

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading compliance center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Governance" title="Document & Compliance Management" subtitle="Track policies, finance documents, safety records, and review-due compliance items from one governance workspace." meta={[`${data.summary.totalDocuments} documents`, `${data.summary.reviewDue} review due`, `${data.summary.expired} expired`, `${data.summary.restricted} restricted visibility`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={FileText} label="Documents" value={data.summary.totalDocuments} helper="Total managed records" tone="blue" />
          <DashboardStatCard icon={ShieldAlert} label="Review Due" value={data.summary.reviewDue} helper="Approaching or marked for review" tone="amber" />
          <DashboardStatCard icon={ShieldAlert} label="Expired" value={data.summary.expired} helper="Needs immediate refresh" tone="rose" />
          <DashboardStatCard icon={FileText} label="Restricted" value={data.summary.restricted} helper="Tighter access requirement" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={FileText} title="Add Compliance Record" subtitle="Register a document for governance tracking" tone="blue" />
            <form onSubmit={submit} className="space-y-4">
              {[
                ['title', 'Title'],
                ['category', 'Category'],
                ['ownerRole', 'Owner Role'],
                ['linkedModule', 'Linked Module'],
                ['dueDate', 'Due Date'],
                ['visibility', 'Visibility'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700">{label}</label>
                  <input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Summary</label>
                <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Save Compliance Record</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShieldAlert} title="Compliance Register" subtitle="Document status and review timeline at a glance" tone="rose" />
            <div className="space-y-3">
              {(data.documents || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.category} | {item.linkedModule} | {item.ownerRole}</p>
                      <p className="mt-2 text-xs text-slate-400">Due {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not set'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-700">{item.status}</span>
                  </div>
                  {item.summary ? <p className="mt-2 text-sm text-slate-600">{item.summary}</p> : null}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default ComplianceCenterPage;
