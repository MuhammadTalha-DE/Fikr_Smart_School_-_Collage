import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BedDouble,
  Building2,
  ClipboardList,
  CloudSun,
  DoorOpen,
  HandCoins,
  Hotel,
  ShieldCheck,
  UserCheck,
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
import { getAdminHostelOverview } from '../../services/hostelPortalService';

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

const QueueItem = ({ title, subtitle, status, extra }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        {extra ? <p className="mt-2 text-xs text-slate-400">{extra}</p> : null}
      </div>
      <StatusBadge value={status} />
    </div>
  </div>
);

const HostelAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    hostels: [],
    summary: {
      totalHostels: 0,
      activeHostels: 0,
      activeResidents: 0,
      availableBeds: 0,
      pendingApplications: 0,
      pendingLeaves: 0,
      pendingVisitors: 0,
      openComplaints: 0,
      attendanceRate: 0,
    },
    feeSummary: {
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      paidRate: 0,
    },
    recentApplications: [],
    recentLeaves: [],
    recentVisitors: [],
    recentComplaints: [],
  });

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);

      try {
        const response = await getAdminHostelOverview();
        setOverview(response.data?.data || overview);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const topHostels = useMemo(
    () => [...(overview.hostels || [])].sort((a, b) => Number(b.occupancyRate || 0) - Number(a.occupancyRate || 0)),
    [overview.hostels]
  );

  if (loading) {
    return (
      <Layout role="admin">
        <div className="p-6 text-center text-slate-500">Loading hostel command center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Hostel Management"
          title="Hostel Command Center"
          subtitle="Run occupancy, resident welfare, complaints, approvals, and hostel revenue from one cleaner control surface for the admin team."
          meta={[
            `${overview.summary.totalHostels || 0} hostels`,
            `${overview.summary.activeResidents || 0} active residents`,
            `${overview.summary.attendanceRate || 0}% hostel attendance`,
            `${overview.summary.openComplaints || 0} open complaints`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Hotel} label="Hostels" to="/admin/hostels" tone="blue" />
              <DashboardQuickLink icon={Users} label="Residents" to="/admin/hostel-residents" tone="emerald" />
              <DashboardQuickLink icon={ClipboardList} label="Applications" to="/admin/hostel-applications" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Building2} label="Active Hostels" value={overview.summary.activeHostels || 0} helper={`${overview.summary.totalHostels || 0} total facilities`} tone="blue" />
          <DashboardStatCard icon={UserCheck} label="Residents" value={overview.summary.activeResidents || 0} helper={`${overview.summary.availableBeds || 0} beds still available`} tone="indigo" />
          <DashboardStatCard icon={AlertTriangle} label="Open Complaints" value={overview.summary.openComplaints || 0} helper={`${overview.summary.pendingLeaves || 0} leaves and ${overview.summary.pendingVisitors || 0} visitors waiting`} tone="amber" />
          <DashboardStatCard icon={HandCoins} label="Hostel Dues" value={formatCurrency(overview.feeSummary.dueAmount)} helper={`${overview.feeSummary.paidRate || 0}% hostel fee collection rate`} tone="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={BedDouble}
                title="Hostel Portfolio"
                subtitle="Capacity, occupancy, and warden ownership by hostel"
                tone="blue"
              />

              {topHostels.length ? (
                <div className="space-y-4">
                  {topHostels.map((hostel) => (
                    <div key={hostel._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-lg font-black text-slate-950">{hostel.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {hostel.type || 'Hostel'} {hostel.wardenId?.name ? `- Warden: ${hostel.wardenId.name}` : ''}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs text-slate-500">Residents</p>
                              <p className="mt-1 text-lg font-black text-slate-950">{hostel.activeResidents || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs text-slate-500">Occupied</p>
                              <p className="mt-1 text-lg font-black text-slate-950">{hostel.occupiedBeds || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs text-slate-500">Available</p>
                              <p className="mt-1 text-lg font-black text-slate-950">{hostel.availableBeds || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs text-slate-500">Rooms</p>
                              <p className="mt-1 text-lg font-black text-slate-950">{hostel.roomCount || 0}</p>
                            </div>
                          </div>
                        </div>

                        <div className="min-w-[220px] rounded-3xl bg-white p-4">
                          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                            <span>Occupancy rate</span>
                            <span>{hostel.occupancyRate || 0}%</span>
                          </div>
                          <DashboardProgressBar value={hostel.occupancyRate || 0} tone="emerald" />
                          <p className="mt-3 text-xs text-slate-500">
                            Status: <span className="font-bold text-slate-700 capitalize">{hostel.status || 'active'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Hotel} title="No hostels created yet" subtitle="Add hostels, rooms, and beds to activate the hostel operations module." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={ShieldCheck}
                title="Applications and Welfare Queue"
                subtitle="Latest student requests and complaint load across hostels"
                tone="amber"
              />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recent applications</p>
                  {overview.recentApplications.length ? (
                    overview.recentApplications.slice(0, 4).map((item) => (
                      <QueueItem
                        key={item._id}
                        title={item.studentId?.userId?.name || 'Student'}
                        subtitle={`${item.studentId?.admissionNumber || 'No admission no.'} - ${item.studentId?.classId?.name || 'Class not assigned'}`}
                        status={item.status}
                        extra={`Submitted ${formatDate(item.createdAt)}`}
                      />
                    ))
                  ) : (
                    <DashboardEmptyState icon={ClipboardList} title="No recent hostel applications" subtitle="Applications will appear here once students begin requesting hostel accommodation." />
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recent complaints</p>
                  {overview.recentComplaints.length ? (
                    overview.recentComplaints.slice(0, 4).map((item) => (
                      <QueueItem
                        key={item._id}
                        title={item.hostelStudentId?.studentId?.userId?.name || 'Resident'}
                        subtitle={`${item.category || 'General'} complaint`}
                        status={item.status}
                        extra={item.description}
                      />
                    ))
                  ) : (
                    <DashboardEmptyState icon={AlertTriangle} title="No complaint feed yet" subtitle="Open and resolved complaint activity will appear here." />
                  )}
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={DoorOpen} title="Bed Availability" subtitle="Campus-wide resident capacity position" tone="emerald" />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Current attendance coverage</span>
                  <span>{overview.summary.attendanceRate || 0}%</span>
                </div>
                <DashboardProgressBar value={overview.summary.attendanceRate || 0} tone="blue" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Available Beds</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.summary.availableBeds || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Pending Applications</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{overview.summary.pendingApplications || 0}</p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={HandCoins} title="Hostel Fee Position" subtitle="Revenue and outstanding dues linked to hostel residents" tone="emerald" />
              <div className="rounded-3xl bg-emerald-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Collection progress</span>
                  <span>{overview.feeSummary.paidRate || 0}%</span>
                </div>
                <DashboardProgressBar value={overview.feeSummary.paidRate || 0} tone="emerald" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Total billed</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Collected</span>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(overview.feeSummary.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className="text-sm text-slate-500">Outstanding</span>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(overview.feeSummary.dueAmount)}</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Users} title="Operations Feed" subtitle="Latest leave and visitor approvals across hostels" tone="violet" />
              <div className="space-y-3">
                {overview.recentLeaves.slice(0, 3).map((item) => (
                  <QueueItem
                    key={item._id}
                    title={item.hostelStudentId?.studentId?.userId?.name || 'Resident'}
                    subtitle={`${item.leaveType || 'Leave'} from ${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`}
                    status={item.status}
                  />
                ))}
                {overview.recentVisitors.slice(0, 3).map((item) => (
                  <QueueItem
                    key={item._id}
                    title={item.visitorName || 'Visitor'}
                    subtitle={`${item.relation || 'Visitor'} for ${item.hostelStudentId?.studentId?.userId?.name || 'resident'}`}
                    status={item.status}
                  />
                ))}
                {!overview.recentLeaves.length && !overview.recentVisitors.length ? (
                  <DashboardEmptyState icon={Users} title="No active leave or visitor feed" subtitle="This section will fill as student movement requests arrive." />
                ) : null}
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Hotel} title="Admin Actions" subtitle="Open the most-used hostel operations areas" tone="blue" />
              <div className="flex flex-wrap gap-2">
                <DashboardQuickLink icon={Hotel} label="Manage Hostels" to="/admin/hostels" tone="blue" />
                <DashboardQuickLink icon={Users} label="Residents" to="/admin/hostel-residents" tone="emerald" />
                <DashboardQuickLink icon={ClipboardList} label="Applications" to="/admin/hostel-applications" tone="amber" />
                <DashboardQuickLink icon={CloudSun} label="Weather" to="/admin/weather/hostel" tone="sky" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HostelAnalytics;
