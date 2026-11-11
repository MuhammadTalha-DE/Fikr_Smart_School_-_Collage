import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Clock3,
  FileText,
  HeartPulse,
  Send,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardProgressBar,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import api from '../../services/api';

const statusTone = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown')}
  </span>
);

const leaveTypeOptions = [
  { value: 'weekend', label: 'Weekend', icon: CalendarClock },
  { value: 'emergency', label: 'Emergency', icon: TimerReset },
  { value: 'medical', label: 'Medical', icon: HeartPulse },
  { value: 'other', label: 'Other', icon: FileText },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not available';

const HostelLeave = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'weekend',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [myLeaves, setMyLeaves] = useState([]);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hostel-leaves');
      setMyLeaves(data || []);
    } catch {
      toast.error('Failed to load hostel leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const stats = useMemo(() => {
    const pending = myLeaves.filter((item) => item.status === 'pending').length;
    const approved = myLeaves.filter((item) => item.status === 'approved').length;
    const rejected = myLeaves.filter((item) => item.status === 'rejected').length;
    const successRate = myLeaves.length ? Math.round((approved / myLeaves.length) * 100) : 0;

    return { pending, approved, rejected, successRate };
  }, [myLeaves]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fromDate || !form.toDate) {
      toast.error('Select both leave dates');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/hostel-leaves', form);
      toast.success('Hostel leave request submitted');
      setForm({ leaveType: 'weekend', fromDate: '', toDate: '', reason: '' });
      await fetchMyLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit hostel leave');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-slate-500">Loading hostel leave center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Hostel"
          title="Hostel Leave Center"
          subtitle="Request weekend, emergency, or medical leave with a clearer workflow and keep your approval history visible in one place."
          meta={[
            `${stats.pending} pending requests`,
            `${stats.approved} approved leaves`,
            `${stats.successRate}% approval rate`,
          ]}
          actions={<DashboardQuickLink icon={ShieldCheck} label="Hostel Portal" to="/student/hostel" tone="blue" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Clock3} label="Pending" value={stats.pending} helper="Waiting for warden/admin approval" tone="amber" />
          <DashboardStatCard icon={ShieldCheck} label="Approved" value={stats.approved} helper="Leave requests already accepted" tone="emerald" />
          <DashboardStatCard icon={TimerReset} label="Rejected" value={stats.rejected} helper="Requests needing a fresh attempt" tone="rose" />
          <DashboardStatCard icon={CalendarClock} label="Success Rate" value={`${stats.successRate}%`} helper="Approval ratio across your requests" tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={Send}
              title="Submit a Leave Request"
              subtitle="Create a cleaner hostel exit request for approval"
              tone="blue"
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Leave type</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {leaveTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const active = form.leaveType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, leaveType: option.value })}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-bold">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">From date</label>
                  <input
                    type="date"
                    value={form.fromDate}
                    onChange={(event) => setForm({ ...form, fromDate: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">To date</label>
                  <input
                    type="date"
                    value={form.toDate}
                    onChange={(event) => setForm({ ...form, toDate: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  placeholder="Add the purpose or any important context for your leave."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </DashboardCard>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={CalendarClock}
                title="Leave History"
                subtitle="Review hostel leave decisions and timelines"
                tone="emerald"
              />

              {myLeaves.length ? (
                <div className="space-y-3">
                  {myLeaves.map((item) => (
                    <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black capitalize text-slate-950">{item.leaveType} leave</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(item.fromDate)} to {formatDate(item.toDate)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">{item.reason || 'No extra reason added.'}</p>
                          {item.rejectionReason ? (
                            <p className="mt-2 text-xs text-rose-700">Rejection note: {item.rejectionReason}</p>
                          ) : null}
                        </div>
                        <StatusBadge value={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={CalendarClock} title="No leave requests yet" subtitle="Your hostel leave history will appear here after your first request." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={ShieldCheck} title="Approval Readiness" subtitle="How your leave history is trending" tone="indigo" />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Approval rate</span>
                  <span>{stats.successRate}%</span>
                </div>
                <DashboardProgressBar value={stats.successRate} tone="indigo" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HostelLeave;
