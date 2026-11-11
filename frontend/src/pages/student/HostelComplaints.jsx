import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  Siren,
  ToolCase,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import api from '../../services/api';

const categoryMeta = {
  electrical: { label: 'Electrical', icon: CircleDot },
  plumbing: { label: 'Plumbing', icon: Wrench },
  furniture: { label: 'Furniture', icon: ToolCase },
  cleanliness: { label: 'Cleanliness', icon: ShieldCheck },
  other: { label: 'Other', icon: AlertTriangle },
};

const priorityTone = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

const statusTone = {
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

const Badge = ({ value, toneMap }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneMap[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

const HostelComplaints = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({
    category: 'electrical',
    description: '',
    priority: 'medium',
  });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hostel-complaints');
      setComplaints(data || []);
    } catch {
      toast.error('Failed to load hostel complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const stats = useMemo(() => {
    const open = complaints.filter((item) => item.status === 'open').length;
    const inProgress = complaints.filter((item) => item.status === 'in_progress').length;
    const resolved = complaints.filter((item) => item.status === 'resolved').length;
    const highPriority = complaints.filter((item) => item.priority === 'high' && item.status !== 'resolved').length;
    return { open, inProgress, resolved, highPriority };
  }, [complaints]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) {
      toast.error('Please describe the issue clearly');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/hostel-complaints', form);
      toast.success('Complaint lodged successfully');
      setForm({ category: 'electrical', description: '', priority: 'medium' });
      await fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-slate-500">Loading complaints center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Hostel"
          title="Hostel Complaints Center"
          subtitle="Report maintenance and welfare issues with a calmer, easier-to-track complaint workflow built for hostel residents."
          meta={[
            `${stats.open} open complaints`,
            `${stats.inProgress} in progress`,
            `${stats.resolved} resolved`,
          ]}
          actions={<DashboardQuickLink icon={ShieldCheck} label="Hostel Portal" to="/student/hostel" tone="blue" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={AlertTriangle} label="Open" value={stats.open} helper="Recently raised or unassigned issues" tone="rose" />
          <DashboardStatCard icon={Wrench} label="In Progress" value={stats.inProgress} helper="Currently being worked on" tone="blue" />
          <DashboardStatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} helper="Issues already completed" tone="emerald" />
          <DashboardStatCard icon={Siren} label="High Priority" value={stats.highPriority} helper="Unresolved issues needing quick attention" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ToolCase} title="Lodge a Complaint" subtitle="Send a maintenance or welfare issue to the hostel team" tone="blue" />
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Category</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {Object.entries(categoryMeta).map(([value, meta]) => {
                    const Icon = meta.icon;
                    const active = form.category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, category: value })}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-bold">{meta.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Priority</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm({ ...form, priority: level })}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        form.priority === level
                          ? priorityTone[level]
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Issue description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe what happened, where it is, and how urgent it feels."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ToolCase className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={AlertTriangle} title="Complaint Tracker" subtitle="Follow each issue from open to resolution" tone="rose" />
            {complaints.length ? (
              <div className="space-y-3">
                {complaints.map((item) => {
                  const Icon = categoryMeta[item.category]?.icon || AlertTriangle;
                  return (
                    <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black capitalize text-slate-950">{item.category}</p>
                            <Badge value={item.priority} toneMap={priorityTone} />
                            <Badge value={item.status} toneMap={statusTone} />
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted {new Date(item.createdAt).toLocaleString()}
                          </p>
                          {item.resolutionNote ? (
                            <p className="mt-2 text-xs text-emerald-700">Resolution note: {item.resolutionNote}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DashboardEmptyState icon={AlertTriangle} title="No complaints filed yet" subtitle="Maintenance or hostel welfare issues you report will appear here with their latest status." />
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default HostelComplaints;
