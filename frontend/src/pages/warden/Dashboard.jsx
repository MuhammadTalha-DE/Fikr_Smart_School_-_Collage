import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  CalendarCheck2,
  ClipboardList,
  CloudSun,
  CreditCard,
  DoorOpen,
  ShieldAlert,
  UserCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherMiniWidget from '../../components/weather/WeatherMiniWidget';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardProgressBar,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getWardenHostelOverview } from '../../services/hostelPortalService';

const getDayLabel = (value) =>
  new Date(value).toLocaleDateString('en-US', { weekday: 'short' });

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const statusTone = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-emerald-100 text-emerald-700',
  checked_out: 'bg-slate-100 text-slate-700',
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

const WardenDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    hostel: null,
    occupancy: { totalBeds: 0, occupiedBeds: 0, availableBeds: 0, occupancyRate: 0, activeResidents: 0, roomCount: 0 },
    todayAttendance: { present: 0, absent: 0, onLeave: 0, total: 0 },
    residentPreview: [],
    queues: { pendingLeaves: 0, pendingVisitors: 0, openComplaints: 0 },
    recentLeaves: [],
    recentVisitors: [],
    recentComplaints: [],
    feeSummary: { totalAmount: 0, paidAmount: 0, dueAmount: 0, paidRate: 0 },
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      try {
        const response = await getWardenHostelOverview();
        setOverview(response.data?.data || overview);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const occupancyRate = Number(overview.occupancy?.occupancyRate || 0);
  const attendancePercent = overview.todayAttendance?.total
    ? Math.round((Number(overview.todayAttendance.present || 0) / Number(overview.todayAttendance.total || 1)) * 100)
    : 0;
  const pendingTotal =
    Number(overview.queues?.pendingLeaves || 0) +
    Number(overview.queues?.pendingVisitors || 0) +
    Number(overview.queues?.openComplaints || 0);

  const residentPreview = useMemo(
    () => overview.residentPreview || [],
    [overview.residentPreview]
  );

  if (loading) {
    return (
      <Layout role="warden">
        <div className="p-6 text-center text-slate-500">Loading warden dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout role="warden">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Hostel Operations"
          title={overview.hostel?.name || 'Warden Dashboard'}
          subtitle="Track occupancy, resident attendance, hostel dues, and daily welfare actions from one cleaner supervision desk."
          meta={[
            `${overview.occupancy?.activeResidents || 0} active residents`,
            `${occupancyRate}% occupancy`,
            `${attendancePercent}% present today`,
            `${pendingTotal} pending actions`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={CalendarCheck2} label="Attendance" to="/warden/attendance" tone="blue" />
              <DashboardQuickLink icon={ClipboardList} label="Leaves" to="/warden/leaves" tone="amber" />
              <DashboardQuickLink icon={ShieldAlert} label="Complaints" to="/warden/complaints" tone="rose" />
            </>
          }
        />

        <WeatherMiniWidget role="warden" compact />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BedDouble} label="Occupied Beds" value={overview.occupancy?.occupiedBeds || 0} helper={`${overview.occupancy?.totalBeds || 0} total beds in hostel`} tone="blue" />
          <DashboardStatCard icon={DoorOpen} label="Available Beds" value={overview.occupancy?.availableBeds || 0} helper={`${occupancyRate}% occupancy rate`} tone="emerald" />
          <DashboardStatCard icon={UserCheck} label="Present Today" value={overview.todayAttendance?.present || 0} helper={`${attendancePercent}% of today's register`} tone="indigo" />
          <DashboardStatCard icon={ShieldAlert} label="Pending Queue" value={pendingTotal} helper="Leaves, visitors, and complaints waiting" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={CalendarCheck2}
                title="Attendance and Resident Preview"
                subtitle="Today's register status and a quick look at current residents"
                tone="blue"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Present</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{overview.todayAttendance?.present || 0}</p>
                </div>
                <div className="rounded-3xl bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Absent</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{overview.todayAttendance?.absent || 0}</p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">On Leave</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{overview.todayAttendance?.onLeave || 0}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Present resident ratio</span>
                  <span>{attendancePercent}%</span>
                </div>
                <DashboardProgressBar value={attendancePercent} tone="emerald" />
              </div>

              <div className="mt-6 space-y-3">
                {residentPreview.length ? (
                  residentPreview.map((resident) => (
                    <div key={resident._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {resident.studentId?.userId?.name || 'Resident'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {resident.studentId?.classId?.name || 'Class not assigned'} - Room {resident.roomId?.roomNumber || 'N/A'} / Bed {resident.bedId?.bedNumber || 'N/A'}
                          </p>
                        </div>
                        <StatusBadge value={resident.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <DashboardEmptyState icon={Users} title="No residents assigned yet" subtitle="Residents will appear here after hostel admissions are approved and bed assignments are completed." />
                )}
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={ClipboardList} title="Approval and Welfare Queue" subtitle="Items requiring your action today" tone="amber" />
              <div className="space-y-3">
                {overview.recentLeaves.slice(0, 3).map((item) => (
                  <FeedItem
                    key={item._id}
                    title={item.hostelStudentId?.studentId?.userId?.name || 'Resident leave request'}
                    subtitle={`${item.leaveType || 'Leave'} from ${getDayLabel(item.fromDate)} to ${getDayLabel(item.toDate)}`}
                    status={item.status}
                  />
                ))}
                {overview.recentVisitors.slice(0, 3).map((item) => (
                  <FeedItem
                    key={item._id}
                    title={item.visitorName || 'Visitor'}
                    subtitle={`${item.relation || 'Visitor'} for ${item.hostelStudentId?.studentId?.userId?.name || 'resident'}`}
                    status={item.status}
                  />
                ))}
                {overview.recentComplaints.slice(0, 3).map((item) => (
                  <FeedItem
                    key={item._id}
                    title={item.hostelStudentId?.studentId?.userId?.name || 'Resident complaint'}
                    subtitle={item.category || 'Hostel complaint'}
                    status={item.status}
                  />
                ))}
                {!overview.recentLeaves.length && !overview.recentVisitors.length && !overview.recentComplaints.length ? (
                  <DashboardEmptyState icon={ClipboardList} title="No pending operational feed yet" subtitle="Leave, visitor, and complaint items will appear here once students begin using the hostel workflows." />
                ) : null}
              </div>
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CloudSun} title="Occupancy Breakdown" subtitle="Capacity pressure and housing load inside your hostel" tone="emerald" />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Occupancy progress</span>
                  <span>{occupancyRate}%</span>
                </div>
                <DashboardProgressBar value={occupancyRate} tone="emerald" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Total Beds</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.occupancy?.totalBeds || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Active Residents</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.occupancy?.activeResidents || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Occupied Beds</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.occupancy?.occupiedBeds || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Rooms</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.occupancy?.roomCount || 0}</p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CreditCard} title="Hostel Fee Position" subtitle="Resident billing and collections inside your hostel" tone="violet" />
              <div className="rounded-3xl bg-violet-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-violet-700">
                  <span>Collection progress</span>
                  <span>{overview.feeSummary?.paidRate || 0}%</span>
                </div>
                <DashboardProgressBar value={overview.feeSummary?.paidRate || 0} tone="violet" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Billed</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary?.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Collected</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary?.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Outstanding</span>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(overview.feeSummary?.dueAmount)}</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={UserRoundCheck} title="Warden Actions" subtitle="Direct links to your most used hostel tools" tone="violet" />
              <div className="flex flex-wrap gap-2">
                <DashboardQuickLink icon={CalendarCheck2} label="Attendance" to="/warden/attendance" tone="blue" />
                <DashboardQuickLink icon={ClipboardList} label="Leaves" to="/warden/leaves" tone="amber" />
                <DashboardQuickLink icon={ShieldAlert} label="Complaints" to="/warden/complaints" tone="rose" />
                <DashboardQuickLink icon={Users} label="Visitors" to="/warden/visitors" tone="indigo" />
                <DashboardQuickLink icon={UserRoundCheck} label="Workflow Center" to="/warden/workflows" tone="violet" />
                <DashboardQuickLink icon={ShieldAlert} label="Security Workflow" to="/warden/security-center" tone="amber" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WardenDashboard;
