import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  CalendarClock,
  CreditCard,
  FileClock,
  Home,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
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
import { getParentHostelOverview } from '../../services/hostelPortalService';

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusTone = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-emerald-100 text-emerald-700',
  checked_out: 'bg-slate-100 text-slate-700',
  not_applied: 'bg-slate-100 text-slate-700',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone[value] || 'bg-slate-100 text-slate-700'}`}>
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

const FeedItem = ({ title, subtitle, status }) => (
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

const HostelOverview = () => {
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [overview, setOverview] = useState({
    children: [],
    selectedChildId: null,
    childOverview: null,
  });

  const fetchOverview = async (studentId = '') => {
    setLoading(true);
    try {
      const response = await getParentHostelOverview(studentId);
      const payload = response.data?.data || { children: [], selectedChildId: null, childOverview: null };
      setOverview(payload);
      if (payload.selectedChildId) {
        setSelectedChildId(String(payload.selectedChildId));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const childPortal = overview.childOverview;
  const resident = childPortal?.resident || null;
  const latestApplication = childPortal?.latestApplication || null;
  const currentStatus = resident ? 'active' : latestApplication?.status || 'not_applied';

  const summaryMeta = useMemo(() => {
    if (!childPortal?.child) return [];
    return [
      childPortal.child.className || 'Class not assigned',
      `${childPortal.attendance?.attendanceRate || 0}% hostel attendance`,
      resident ? `Room ${resident.roomId?.roomNumber || 'N/A'}` : 'No active room allocation',
    ];
  }, [childPortal, resident]);

  if (loading) {
    return (
      <Layout role="parent">
        <div className="p-6 text-center text-slate-500">Loading hostel portal...</div>
      </Layout>
    );
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Parent Hostel View"
          title="Child Hostel Portal"
          subtitle="Follow your child’s hostel room assignment, attendance, fee position, complaints, and movement requests from one calmer family-facing view."
          meta={summaryMeta}
          actions={
            <>
              <DashboardQuickLink icon={CreditCard} label="Fee Portal" to="/parent/fees" tone="emerald" />
              <DashboardQuickLink icon={Home} label="Transport" to="/parent/transport" tone="blue" />
            </>
          }
        />

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Users} title="Select Child" subtitle="Switch between your children to review hostel details" tone="blue" />
          {overview.children.length ? (
            <div className="flex flex-wrap gap-2">
              {overview.children.map((child) => {
                const isActive = String(child._id) === String(selectedChildId);
                return (
                  <button
                    key={child._id}
                    type="button"
                    onClick={() => fetchOverview(child._id)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">{child.name}</p>
                    <p className="text-xs opacity-80">{child.className || 'Class not assigned'}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <DashboardEmptyState icon={Users} title="No linked children found" subtitle="Parent to student links need to be set before hostel visibility can appear here." />
          )}
        </DashboardCard>

        {childPortal ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard icon={UserRound} label="Child Status" value={currentStatus.replace('_', ' ')} helper={childPortal.child?.name || 'Child'} tone="blue" />
              <DashboardStatCard icon={ShieldCheck} label="Attendance" value={`${childPortal.attendance?.attendanceRate || 0}%`} helper={`${childPortal.attendance?.present || 0} present days`} tone="emerald" />
              <DashboardStatCard icon={CalendarClock} label="Pending Actions" value={(childPortal.actionSummary?.pendingLeaves || 0) + (childPortal.actionSummary?.pendingVisitors || 0)} helper={`${childPortal.actionSummary?.openComplaints || 0} open complaints`} tone="amber" />
              <DashboardStatCard icon={CreditCard} label="Hostel Dues" value={formatCurrency(childPortal.feeSummary?.dueAmount)} helper={`${childPortal.feeSummary?.paidRate || 0}% paid`} tone="indigo" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <DashboardCard className="p-5 md:p-6">
                  <DashboardSectionHeader icon={BedDouble} title="Room and Allocation" subtitle="Where your child is currently placed inside the hostel" tone="blue" />
                  {resident ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Hostel</p>
                            <p className="mt-2 text-xl font-black text-slate-950">{resident.hostelId?.name || 'Assigned hostel'}</p>
                          </div>
                          <StatusBadge value="active" />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{resident.hostelId?.type || 'Resident placement is active'}</p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Room and Bed</p>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          Room {resident.roomId?.roomNumber || 'N/A'} / Bed {resident.bedId?.bedNumber || 'N/A'}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">{resident.roomId?.roomType || 'Room details not available'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-slate-950">No active hostel room allocation</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {latestApplication
                              ? `Latest application status: ${latestApplication.status.replace('_', ' ')}`
                              : 'No hostel application found for this child.'}
                          </p>
                        </div>
                        <StatusBadge value={currentStatus} />
                      </div>
                    </div>
                  )}
                </DashboardCard>

                <DashboardCard className="p-5 md:p-6">
                  <DashboardSectionHeader icon={ShieldCheck} title="Attendance and Care Overview" subtitle="Attendance consistency and resident wellbeing load" tone="emerald" />
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Attendance rate</span>
                      <span>{childPortal.attendance?.attendanceRate || 0}%</span>
                    </div>
                    <DashboardProgressBar value={childPortal.attendance?.attendanceRate || 0} tone="emerald" />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Present</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{childPortal.attendance?.present || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Absent</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{childPortal.attendance?.absent || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">On Leave</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{childPortal.attendance?.onLeave || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Complaints</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{childPortal.actionSummary?.openComplaints || 0}</p>
                    </div>
                  </div>
                </DashboardCard>
              </div>

              <div className="space-y-6">
                <DashboardCard className="p-5 md:p-6">
                  <DashboardSectionHeader icon={CreditCard} title="Hostel Fee Position" subtitle="Payment progress for hostel-related billing" tone="indigo" />
                  <div className="rounded-3xl bg-indigo-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-indigo-700">
                      <span>Payment progress</span>
                      <span>{childPortal.feeSummary?.paidRate || 0}%</span>
                    </div>
                    <DashboardProgressBar value={childPortal.feeSummary?.paidRate || 0} tone="indigo" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <span className="text-sm text-slate-500">Total</span>
                      <span className="text-sm font-black text-slate-950">{formatCurrency(childPortal.feeSummary?.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <span className="text-sm text-slate-500">Paid</span>
                      <span className="text-sm font-black text-slate-950">{formatCurrency(childPortal.feeSummary?.paidAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <span className="text-sm text-slate-500">Due</span>
                      <span className="text-sm font-black text-rose-700">{formatCurrency(childPortal.feeSummary?.dueAmount)}</span>
                    </div>
                  </div>
                </DashboardCard>

                <DashboardCard className="p-5 md:p-6">
                  <DashboardSectionHeader icon={FileClock} title="Leave and Visitor Feed" subtitle="Latest movement requests linked to your child" tone="amber" />
                  <div className="space-y-3">
                    {childPortal.leaves?.slice(0, 3).map((item) => (
                      <FeedItem
                        key={item._id}
                        title={`${item.leaveType || 'Leave'} leave`}
                        subtitle={`${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`}
                        status={item.status}
                      />
                    ))}
                    {childPortal.visitors?.slice(0, 3).map((item) => (
                      <FeedItem
                        key={item._id}
                        title={item.visitorName || 'Visitor'}
                        subtitle={`${item.relation || 'Visitor'}${item.purpose ? ` - ${item.purpose}` : ''}`}
                        status={item.status}
                      />
                    ))}
                    {!childPortal.leaves?.length && !childPortal.visitors?.length ? (
                      <DashboardEmptyState icon={FileClock} title="No leave or visitor records yet" subtitle="This movement feed will appear once requests begin." />
                    ) : null}
                  </div>
                </DashboardCard>

                <DashboardCard className="p-5 md:p-6">
                  <DashboardSectionHeader icon={Home} title="Complaint and Application Feed" subtitle="Issues and latest application state for this child" tone="rose" />
                  <div className="space-y-3">
                    {latestApplication ? (
                      <FeedItem
                        title="Latest hostel application"
                        subtitle={`Submitted ${formatDate(latestApplication.createdAt)}`}
                        status={latestApplication.status}
                      />
                    ) : null}
                    {childPortal.complaints?.slice(0, 3).map((item) => (
                      <FeedItem
                        key={item._id}
                        title={item.category || 'Hostel complaint'}
                        subtitle={item.description}
                        status={item.status}
                      />
                    ))}
                    {!latestApplication && !childPortal.complaints?.length ? (
                      <DashboardEmptyState icon={Home} title="No complaints or applications" subtitle="Hostel concerns and application history will appear here." />
                    ) : null}
                  </div>
                </DashboardCard>
              </div>
            </div>
          </>
        ) : (
          <DashboardEmptyState icon={Home} title="Select a child to continue" subtitle="Once a child is selected, their hostel allocation and welfare data will appear here." />
        )}
      </div>
    </Layout>
  );
};

export default HostelOverview;
