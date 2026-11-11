import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Clock3,
  DoorOpen,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
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
import toast from 'react-hot-toast';

const statusTone = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  checked_in: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  checked_out: 'bg-slate-100 text-slate-700 border-slate-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'checked_in', label: 'Inside' },
  { value: 'checked_out', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const formatStatus = (value) => String(value || 'unknown').replace('_', ' ');

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

const studentName = (visitor) =>
  visitor.hostelStudentId?.studentId?.userId?.name || 'Resident not linked';

const actionPastTense = {
  approve: 'approved',
  reject: 'rejected',
  checkin: 'checked in',
  checkout: 'checked out',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusTone[value] || statusTone.checked_out}`}>
    {formatStatus(value)}
  </span>
);

const ActionButton = ({ icon: Icon, label, tone, onClick, disabled }) => {
  const tones = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    slate: 'bg-slate-700 text-white hover:bg-slate-800',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone] || tones.slate}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};

const VisitorActions = ({ visitor, busyId, onAction }) => {
  const isBusy = busyId === visitor._id;

  if (visitor.status === 'pending') {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={UserRoundCheck} label="Approve" tone="emerald" disabled={isBusy} onClick={() => onAction(visitor._id, 'approve')} />
        <ActionButton icon={UserRoundX} label="Reject" tone="rose" disabled={isBusy} onClick={() => onAction(visitor._id, 'reject')} />
      </div>
    );
  }

  if (visitor.status === 'approved') {
    return (
      <ActionButton icon={LogIn} label="Check In" tone="blue" disabled={isBusy} onClick={() => onAction(visitor._id, 'checkin')} />
    );
  }

  if (visitor.status === 'checked_in') {
    return (
      <ActionButton icon={LogOut} label="Check Out" tone="slate" disabled={isBusy} onClick={() => onAction(visitor._id, 'checkout')} />
    );
  }

  return <span className="text-xs font-semibold text-slate-400">No action</span>;
};

const VisitorManagement = ({ role = 'warden' }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const { data } = await api.get('/hostel-visitors', { params });
      setVisitors(data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [status]);

  const stats = useMemo(() => ({
    pending: visitors.filter((item) => item.status === 'pending').length,
    approved: visitors.filter((item) => item.status === 'approved').length,
    inside: visitors.filter((item) => item.status === 'checked_in').length,
    completed: visitors.filter((item) => item.status === 'checked_out').length,
  }), [visitors]);

  const filteredVisitors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return visitors;

    return visitors.filter((visitor) =>
      [
        visitor.visitorName,
        visitor.relation,
        visitor.purpose,
        studentName(visitor),
        visitor.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [search, visitors]);

  const handleAction = async (id, action) => {
    setBusyId(id);
    try {
      await api.put(`/hostel-visitors/${id}/${action}`);
      toast.success(`Visitor ${actionPastTense[action] || 'updated'}`);
      await fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Visitor action failed');
    } finally {
      setBusyId('');
    }
  };

  const rolePrefix = role === 'admin' ? '/admin' : '/warden';

  return (
    <Layout role={role}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Hostel Security"
          title="Visitor Approval Center"
          subtitle={role === 'admin'
            ? 'Review hostel visitor requests across all hostels, approve or reject access, and monitor entry completion.'
            : 'Review visitor requests for your assigned hostel, then manage check-in and check-out from one clear queue.'}
          meta={[
            `${stats.pending} pending`,
            `${stats.approved} approved`,
            `${stats.inside} currently inside`,
            `${stats.completed} completed`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={ShieldCheck} label="Hostel Dashboard" to={role === 'admin' ? '/admin/hostel-analytics' : '/warden/dashboard'} tone="blue" />
              <DashboardQuickLink icon={Users} label="Residents" to={`${rolePrefix}/hostel-residents`} tone="emerald" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Clock3} label="Pending" value={stats.pending} helper="Waiting for approval" tone="amber" />
          <DashboardStatCard icon={BadgeCheck} label="Approved" value={stats.approved} helper="Ready for hostel entry" tone="blue" />
          <DashboardStatCard icon={DoorOpen} label="Inside" value={stats.inside} helper="Currently checked in" tone="emerald" />
          <DashboardStatCard icon={LogOut} label="Completed" value={stats.completed} helper="Checked out visits" tone="slate" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader
            icon={ShieldCheck}
            title="Visitor Requests"
            subtitle="Approve requests, reject invalid visits, and record visitor movement"
            tone="blue"
          />

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                    status === option.value
                      ? 'border-blue-200 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:max-w-xs">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search visitor, student, purpose"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Loading visitor requests...</div>
          ) : filteredVisitors.length ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Visitor</th>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Purpose</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Movement</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor._id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-4">
                          <p className="font-black text-slate-950">{visitor.visitorName}</p>
                          <p className="mt-1 text-xs text-slate-500">{visitor.relation || 'Relation not specified'}</p>
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-700">{studentName(visitor)}</td>
                        <td className="max-w-xs px-3 py-4 text-slate-600">{visitor.purpose || 'No purpose provided'}</td>
                        <td className="px-3 py-4"><StatusBadge value={visitor.status} /></td>
                        <td className="px-3 py-4 text-xs text-slate-500">
                          <p>In: {formatDateTime(visitor.checkIn)}</p>
                          <p className="mt-1">Out: {formatDateTime(visitor.checkOut)}</p>
                        </td>
                        <td className="px-3 py-4">
                          <VisitorActions visitor={visitor} busyId={busyId} onAction={handleAction} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {filteredVisitors.map((visitor) => (
                  <div key={visitor._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950">{visitor.visitorName}</p>
                        <p className="mt-1 text-xs text-slate-500">{visitor.relation || 'Relation not specified'} for {studentName(visitor)}</p>
                      </div>
                      <StatusBadge value={visitor.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{visitor.purpose || 'No purpose provided'}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <p>Check-in: {formatDateTime(visitor.checkIn)}</p>
                      <p>Check-out: {formatDateTime(visitor.checkOut)}</p>
                    </div>
                    <div className="mt-4">
                      <VisitorActions visitor={visitor} busyId={busyId} onAction={handleAction} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <DashboardEmptyState icon={Users} title="No visitor requests found" subtitle="Visitor requests will appear here after hostel students submit them." />
          )}
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default VisitorManagement;
