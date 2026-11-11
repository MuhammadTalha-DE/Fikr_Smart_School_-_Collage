import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BedDouble,
  CalendarClock,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FilePenLine,
  Home,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  UserRoundPlus,
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
import { getStudentHostelOverview } from '../../services/hostelPortalService';

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const badgeTone = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  not_applied: 'bg-slate-100 text-slate-700',
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-emerald-100 text-emerald-700',
  checked_out: 'bg-slate-100 text-slate-700',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeTone[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

const ActivityRow = ({ title, subtitle, status }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <StatusBadge value={status} />
    </div>
  </div>
);

const HostelApplication = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [overview, setOverview] = useState({
    student: null,
    resident: null,
    attendance: { totalDays: 0, present: 0, absent: 0, onLeave: 0, attendanceRate: 0, recent: [] },
    leaves: [],
    visitors: [],
    complaints: [],
    applications: [],
    latestApplication: null,
    feeSummary: { totalAmount: 0, paidAmount: 0, dueAmount: 0, paidRate: 0 },
    actionSummary: { pendingLeaves: 0, pendingVisitors: 0, openComplaints: 0 },
  });

  const fetchOverview = async () => {
    setLoading(true);

    try {
      const response = await getStudentHostelOverview();
      setOverview(response.data?.data || overview);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load hostel portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const currentStatus = useMemo(() => {
    if (overview.resident) return 'active';
    return overview.latestApplication?.status || 'not_applied';
  }, [overview.resident, overview.latestApplication]);

  const statusSummary = useMemo(() => {
    if (overview.resident) {
      return 'You are currently an active hostel resident.';
    }
    if (overview.latestApplication?.status === 'pending') {
      return 'Your hostel application is waiting for approval.';
    }
    if (overview.latestApplication?.status === 'rejected') {
      return 'Your last hostel application was rejected. You can submit a new request.';
    }
    return 'You are not yet assigned to a hostel.';
  }, [overview.resident, overview.latestApplication]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      toast.error('Please add a reason for hostel accommodation.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/hostel-applications', { reason: reason.trim() });
      toast.success('Hostel application submitted successfully.');
      setReason('');
      await fetchOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit hostel application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-slate-500">Loading hostel portal...</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Student Hostel"
          title="Hostel Portal"
          subtitle="Track your room status, attendance, leave, visitor requests, complaints, and hostel fee position from one cleaner place."
          meta={[
            overview.student?.className || 'Class not assigned',
            statusSummary,
            `${overview.attendance.attendanceRate || 0}% hostel attendance`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={CalendarClock} label="Leave" to="/student/hostel-leave" tone="blue" />
              <DashboardQuickLink icon={UserRoundPlus} label="Visitor" to="/student/hostel-visitor" tone="emerald" />
              <DashboardQuickLink icon={MessageSquareWarning} label="Complaints" to="/student/hostel-complaints" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Home} label="Hostel Status" value={currentStatus.replace('_', ' ')} helper={overview.resident?.hostelId?.name || 'No room assigned yet'} tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Attendance" value={`${overview.attendance.attendanceRate || 0}%`} helper={`${overview.attendance.present || 0} present of ${overview.attendance.totalDays || 0} tracked days`} tone="emerald" />
          <DashboardStatCard icon={ClipboardList} label="Pending Actions" value={(overview.actionSummary.pendingLeaves || 0) + (overview.actionSummary.pendingVisitors || 0)} helper={`${overview.actionSummary.openComplaints || 0} open complaints still active`} tone="amber" />
          <DashboardStatCard icon={CreditCard} label="Hostel Dues" value={formatCurrency(overview.feeSummary.dueAmount)} helper={`${overview.feeSummary.paidRate || 0}% hostel fee collection status`} tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={BedDouble}
                title="Room and Residency Status"
                subtitle="Your current allocation, application state, and housing summary"
                tone="blue"
              />

              {overview.resident ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Hostel</p>
                        <p className="mt-2 text-xl font-black text-slate-950">{overview.resident.hostelId?.name || 'Assigned hostel'}</p>
                      </div>
                      <StatusBadge value="active" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{overview.resident.hostelId?.type || 'Hostel resident allocation active'}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Room and Bed</p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      Room {overview.resident.roomId?.roomNumber || 'N/A'} / Bed {overview.resident.bedId?.bedNumber || 'N/A'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{overview.resident.roomId?.roomType || 'Room type not set'}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-950">No active hostel allocation</p>
                      <p className="mt-1 text-sm text-slate-500">{statusSummary}</p>
                    </div>
                    <StatusBadge value={currentStatus} />
                  </div>
                  {overview.latestApplication?.rejectionReason ? (
                    <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Rejection note: {overview.latestApplication.rejectionReason}
                    </p>
                  ) : null}
                </div>
              )}

              {!overview.resident && currentStatus !== 'pending' ? (
                <form onSubmit={handleSubmit} className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                  <label className="block text-sm font-semibold text-slate-700">Reason for hostel accommodation</label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    placeholder="Tell the administration why you need hostel accommodation."
                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Submitting...' : 'Submit Hostel Application'}
                  </button>
                </form>
              ) : null}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={ShieldCheck}
                title="Attendance and Welfare"
                subtitle="Your recent hostel attendance and welfare load"
                tone="emerald"
              />

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Attendance rate</span>
                  <span>{overview.attendance.attendanceRate || 0}%</span>
                </div>
                <DashboardProgressBar value={overview.attendance.attendanceRate || 0} tone="emerald" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Present</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.attendance.present || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Absent</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.attendance.absent || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">On Leave</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.attendance.onLeave || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Open Complaints</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.actionSummary.openComplaints || 0}</p>
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CreditCard} title="Hostel Fee Summary" subtitle="Track hostel billing and payment progress" tone="indigo" />
              <div className="rounded-3xl bg-indigo-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-indigo-700">
                  <span>Payment progress</span>
                  <span>{overview.feeSummary.paidRate || 0}%</span>
                </div>
                <DashboardProgressBar value={overview.feeSummary.paidRate || 0} tone="indigo" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Paid</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Due</span>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(overview.feeSummary.dueAmount)}</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CalendarClock} title="Recent Leave and Visitor Activity" subtitle="Your latest movement requests" tone="amber" />
              <div className="space-y-3">
                {overview.leaves.slice(0, 3).map((item) => (
                  <ActivityRow
                    key={item._id}
                    title={`${item.leaveType || 'Leave'} leave`}
                    subtitle={`${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`}
                    status={item.status}
                  />
                ))}
                {overview.visitors.slice(0, 3).map((item) => (
                  <ActivityRow
                    key={item._id}
                    title={item.visitorName || 'Visitor'}
                    subtitle={`${item.relation || 'Visitor'}${item.purpose ? ` - ${item.purpose}` : ''}`}
                    status={item.status}
                  />
                ))}
                {!overview.leaves.length && !overview.visitors.length ? (
                  <DashboardEmptyState icon={CalendarClock} title="No leave or visitor history yet" subtitle="Your movement requests will appear here once they are submitted." />
                ) : null}
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={MessageSquareWarning} title="Complaint Tracker" subtitle="Recent hostel issues raised from your account" tone="rose" />
              <div className="space-y-3">
                {overview.complaints.slice(0, 4).map((item) => (
                  <ActivityRow
                    key={item._id}
                    title={item.category || 'Hostel complaint'}
                    subtitle={item.description}
                    status={item.status}
                  />
                ))}
                {!overview.complaints.length ? (
                  <DashboardEmptyState icon={MessageSquareWarning} title="No complaints filed" subtitle="Any hostel issue you raise will show here with its current resolution status." />
                ) : null}
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={FilePenLine} title="Quick Actions" subtitle="Open the most used student hostel tools" tone="blue" />
              <div className="flex flex-wrap gap-2">
                <DashboardQuickLink icon={CalendarClock} label="Apply Leave" to="/student/hostel-leave" tone="blue" />
                <DashboardQuickLink icon={UserRoundPlus} label="Visitor Request" to="/student/hostel-visitor" tone="emerald" />
                <DashboardQuickLink icon={MessageSquareWarning} label="Complaint" to="/student/hostel-complaints" tone="amber" />
                <DashboardQuickLink icon={DoorOpen} label="Mess Menu" to="/student/mess-menu" tone="violet" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HostelApplication;
