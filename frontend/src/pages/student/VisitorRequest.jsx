import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Clock3,
  MessageCircleMore,
  ShieldCheck,
  UserRoundPlus,
  Users,
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

const statusTone = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-emerald-100 text-emerald-700',
  checked_out: 'bg-slate-100 text-slate-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not recorded';

const VisitorRequest = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ visitorName: '', relation: '', purpose: '' });
  const [visitors, setVisitors] = useState([]);

  const fetchMyVisitors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hostel-visitors');
      setVisitors(data || []);
    } catch {
      toast.error('Failed to load visitor requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVisitors();
  }, []);

  const stats = useMemo(() => {
    const pending = visitors.filter((item) => item.status === 'pending').length;
    const approved = visitors.filter((item) => ['approved', 'checked_in', 'checked_out'].includes(item.status)).length;
    const activeInside = visitors.filter((item) => item.status === 'checked_in').length;
    const rejected = visitors.filter((item) => item.status === 'rejected').length;
    return { pending, approved, activeInside, rejected };
  }, [visitors]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.visitorName.trim()) {
      toast.error('Visitor name is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/hostel-visitors', form);
      toast.success('Visitor request submitted');
      setForm({ visitorName: '', relation: '', purpose: '' });
      await fetchMyVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit visitor request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-slate-500">Loading visitor center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Hostel"
          title="Visitor Request Center"
          subtitle="Manage family or guardian visitor requests with cleaner approvals, check-in visibility, and a clearer request history."
          meta={[
            `${stats.pending} pending requests`,
            `${stats.approved} approved visits`,
            `${stats.activeInside} currently inside`,
          ]}
          actions={<DashboardQuickLink icon={ShieldCheck} label="Hostel Portal" to="/student/hostel" tone="blue" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Clock3} label="Pending" value={stats.pending} helper="Waiting for approval" tone="amber" />
          <DashboardStatCard icon={BadgeCheck} label="Approved" value={stats.approved} helper="Approved or completed visitor flow" tone="blue" />
          <DashboardStatCard icon={Users} label="Checked In" value={stats.activeInside} helper="Visitors currently inside hostel" tone="emerald" />
          <DashboardStatCard icon={MessageCircleMore} label="Rejected" value={stats.rejected} helper="Requests not accepted" tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={UserRoundPlus} title="Request a Visitor" subtitle="Create a hostel visitor approval request" tone="blue" />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Visitor name</label>
                <input
                  type="text"
                  value={form.visitorName}
                  onChange={(event) => setForm({ ...form, visitorName: event.target.value })}
                  placeholder="Enter visitor full name"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Relation</label>
                  <input
                    type="text"
                    value={form.relation}
                    onChange={(event) => setForm({ ...form, relation: event.target.value })}
                    placeholder="Father, mother, guardian..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Purpose</label>
                  <input
                    type="text"
                    value={form.purpose}
                    onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                    placeholder="Brief reason for the visit"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserRoundPlus className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Visitor Request'}
              </button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Visitor History" subtitle="Track approvals, check-ins, and completed visits" tone="emerald" />
            {visitors.length ? (
              <div className="space-y-3">
                {visitors.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950">{item.visitorName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.relation || 'Relation not specified'}{item.purpose ? ` - ${item.purpose}` : ''}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>Check-in: {formatDateTime(item.checkIn)}</p>
                          <p>Check-out: {formatDateTime(item.checkOut)}</p>
                        </div>
                      </div>
                      <StatusBadge value={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={Users} title="No visitor requests yet" subtitle="Your approved visitor requests and entry timeline will appear here." />
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default VisitorRequest;
