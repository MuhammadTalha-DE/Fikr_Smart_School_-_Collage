/*
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FiAlertTriangle,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiExternalLink,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import Layout from '../../components/common/Layout';
import SchoolClock from '../../components/SchoolClock';
import WeatherMiniWidget from '../../components/weather/WeatherMiniWidget';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip
);

const emptyDashboard = {
  generatedAt: null,
  systemStatus: { realtime: false, autoRefreshSeconds: 30 },
  overview: {
    people: {
      totalUsers: 0,
      students: 0,
      teachers: 0,
      parents: 0,
      classes: 0,
      admins: 0,
      wardens: 0,
      librarians: 0,
    },
    academics: {
      assignmentsDueSoon: 0,
      examsUpcoming: 0,
      attendanceRate: 0,
      averagePerformance: 0,
    },
    finance: {
      monthlyCollection: 0,
      totalCollection: 0,
      billedAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      paidAccounts: 0,
      partialAccounts: 0,
      pendingAccounts: 0,
      unpaidAccounts: 0,
    },
    library: {
      titles: 0,
      copies: 0,
      availableCopies: 0,
      issuedLoans: 0,
      overdueLoans: 0,
    },
    transport: {
      routes: 0,
      activeRoutes: 0,
      vehicles: 0,
      activeVehicles: 0,
      activeAllocations: 0,
    },
    hostel: {
      totalHostels: 0,
      activeHostels: 0,
      activeResidents: 0,
      pendingApplications: 0,
      openComplaints: 0,
      pendingLeaves: 0,
    },
    safety: {
      totalAlerts: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      totalIncidents: 0,
      pendingIncidents: 0,
      emergencyContacts: 0,
    },
    admissions: {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
    },
    communication: {
      announcements: 0,
      unreadMessages: 0,
      messagesLast7Days: 0,
    },
  },
  recentActivities: [],
  upcomingEvents: [],
  attentionItems: [],
  attendance: {
    present: 0,
    absent: 0,
    rate: 0,
    asOf: null,
  },
  topClasses: [],
  bottomClasses: [],
};

const cardToneClasses = {
  blue: 'from-blue-600 to-cyan-500 shadow-blue-500/20',
  emerald: 'from-emerald-600 to-green-500 shadow-emerald-500/20',
  amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
  rose: 'from-rose-500 to-red-500 shadow-rose-500/20',
  violet: 'from-violet-600 to-fuchsia-500 shadow-violet-500/20',
  slate: 'from-slate-600 to-slate-500 shadow-slate-500/20',
};

const moduleAccentClasses = {
  blue: 'border-blue-200/70 bg-blue-50/80 text-blue-700',
  emerald: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-700',
  amber: 'border-amber-200/70 bg-amber-50/80 text-amber-700',
  rose: 'border-rose-200/70 bg-rose-50/80 text-rose-700',
  violet: 'border-violet-200/70 bg-violet-50/80 text-violet-700',
  slate: 'border-slate-200/70 bg-slate-100/80 text-slate-700',
};

const attentionToneClasses = {
  danger: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

const formatCurrency = (value) =>
  `PKR ${Number(value || 0).toLocaleString()}`;

const formatCompact = (value) => Number(value || 0).toLocaleString();

const OverviewCard = ({ icon: Icon, label, value, hint, tone = 'blue' }) => (
  <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      </div>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cardToneClasses[tone]} text-white shadow-xl`}
      >
        <Icon className="text-2xl" />
      </div>
    </div>
  </div>
);

const SectionPanel = ({ title, subtitle, action, children }) => (
  <section className="rounded-[28px] border border-white/65 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ModuleCard = ({ title, description, icon: Icon, href, accent = 'blue', stats }) => (
  <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5 transition-transform duration-200 hover:-translate-y-1">
    <div className="flex items-start justify-between gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${moduleAccentClasses[accent]}`}
      >
        <Icon className="text-xl" />
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
      >
        Open <FiExternalLink />
      </Link>
    </div>
    <div className="mt-4">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white px-3 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {stat.label}
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">{stat.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { socket, isConnected } = useSocket();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await api.get('/dashboard/admin');
      setDashboard({ ...emptyDashboard, ...data });
      setError('');
    } catch (err) {
      console.error('Failed to fetch admin dashboard', err);
      setError(
        err?.response?.data?.message || 'Unable to load the main admin dashboard right now.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);

    const intervalId = window.setInterval(() => {
      fetchDashboard(false);
    }, (dashboard.systemStatus.autoRefreshSeconds || 30) * 1000);

    const handleFocus = () => fetchDashboard(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleDashboardRefresh = () => {
      fetchDashboard(false);
    };

    socket.on('dashboard:refresh', handleDashboardRefresh);

    return () => {
      socket.off('dashboard:refresh', handleDashboardRefresh);
    };
  }, [socket]);

  const { overview, recentActivities, upcomingEvents, attentionItems, topClasses, bottomClasses } =
    dashboard;

  const overviewCards = [
    {
      label: 'Students',
      value: formatCompact(overview.people.students),
      hint: `${formatCompact(overview.people.classes)} classes currently running`,
      icon: FiUsers,
      tone: 'blue',
    },
    {
      label: 'Teachers',
      value: formatCompact(overview.people.teachers),
      hint: `${formatCompact(overview.people.totalUsers)} total platform accounts`,
      icon: FiUserCheck,
      tone: 'emerald',
    },
    {
      label: 'Parents',
      value: formatCompact(overview.people.parents),
      hint: `${formatCompact(overview.communication.announcements)} announcements published`,
      icon: FiHome,
      tone: 'violet',
    },
    {
      label: 'Attendance',
      value: `${overview.academics.attendanceRate}%`,
      hint: dashboard.attendance.asOf
        ? `Latest marked day: ${format(new Date(dashboard.attendance.asOf), 'dd MMM yyyy')}`
        : 'No attendance records marked yet',
      icon: FiCheckCircle,
      tone: 'amber',
    },
    {
      label: 'Monthly Collection',
      value: formatCurrency(overview.finance.monthlyCollection),
      hint: `${formatCurrency(overview.finance.outstandingAmount)} still outstanding`,
      icon: FiDollarSign,
      tone: 'emerald',
    },
    {
      label: 'Active Alerts',
      value: formatCompact(overview.safety.activeAlerts),
      hint: `${formatCompact(overview.safety.pendingIncidents)} unresolved incidents`,
      icon: FiAlertTriangle,
      tone: 'rose',
    },
  ];

  const moduleCards = [
    {
      title: 'Academics',
      description: 'Assignments, exams, attendance, and performance in one view.',
      icon: FiBookOpen,
      href: '/admin/analytics',
      accent: 'blue',
      stats: [
        { label: 'Assignments', value: formatCompact(overview.academics.assignmentsDueSoon) },
        { label: 'Exams', value: formatCompact(overview.academics.examsUpcoming) },
        { label: 'Avg Score', value: `${overview.academics.averagePerformance}%` },
      ],
    },
    {
      title: 'Admissions',
      description: 'Track intake movement from pending to accepted.',
      icon: FiLayers,
      href: '/admin/admissions',
      accent: 'amber',
      stats: [
        { label: 'Pending', value: formatCompact(overview.admissions.pending) },
        { label: 'Accepted', value: formatCompact(overview.admissions.accepted) },
        { label: 'Rejected', value: formatCompact(overview.admissions.rejected) },
      ],
    },
    {
      title: 'Finance',
      description: 'Collection momentum, billing, and outstanding balances.',
      icon: FiDollarSign,
      href: '/admin/reports/collection',
      accent: 'emerald',
      stats: [
        { label: 'Collected', value: formatCurrency(overview.finance.monthlyCollection) },
        { label: 'Outstanding', value: formatCurrency(overview.finance.outstandingAmount) },
        {
          label: 'Open Accts',
          value: formatCompact(
            overview.finance.partialAccounts +
              overview.finance.pendingAccounts +
              overview.finance.unpaidAccounts
          ),
        },
      ],
    },
    {
      title: 'Library',
      description: 'Inventory, circulation, and overdue monitoring.',
      icon: FiBookOpen,
      href: '/library/dashboard',
      accent: 'violet',
      stats: [
        { label: 'Titles', value: formatCompact(overview.library.titles) },
        { label: 'Issued', value: formatCompact(overview.library.issuedLoans) },
        { label: 'Overdue', value: formatCompact(overview.library.overdueLoans) },
      ],
    },
    {
      title: 'Transport',
      description: 'Vehicle readiness, routes, and active allocations.',
      icon: FiTruck,
      href: '/admin/transport',
      accent: 'blue',
      stats: [
        { label: 'Vehicles', value: formatCompact(overview.transport.activeVehicles) },
        { label: 'Routes', value: formatCompact(overview.transport.activeRoutes) },
        { label: 'Riders', value: formatCompact(overview.transport.activeAllocations) },
      ],
    },
    {
      title: 'Hostel',
      description: 'Residents, applications, and issue flow across hostels.',
      icon: FiHome,
      href: '/admin/hostel-analytics',
      accent: 'amber',
      stats: [
        { label: 'Residents', value: formatCompact(overview.hostel.activeResidents) },
        { label: 'Applications', value: formatCompact(overview.hostel.pendingApplications) },
        { label: 'Complaints', value: formatCompact(overview.hostel.openComplaints) },
      ],
    },
    {
      title: 'Safety',
      description: 'Alerts, incidents, and emergency readiness from one place.',
      icon: FiShield,
      href: '/admin/safety-dashboard',
      accent: 'rose',
      stats: [
        { label: 'Active', value: formatCompact(overview.safety.activeAlerts) },
        { label: 'Critical', value: formatCompact(overview.safety.criticalAlerts) },
        { label: 'Contacts', value: formatCompact(overview.safety.emergencyContacts) },
      ],
    },
    {
      title: 'Communication',
      description: 'Announcements and platform messaging activity.',
      icon: FiMessageSquare,
      href: '/admin/messages',
      accent: 'slate',
      stats: [
        { label: 'Unread', value: formatCompact(overview.communication.unreadMessages) },
        { label: '7 Days', value: formatCompact(overview.communication.messagesLast7Days) },
        { label: 'Alerts', value: formatCompact(overview.communication.announcements) },
      ],
    },
  ];

  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [dashboard.attendance.present, dashboard.attendance.absent],
        backgroundColor: ['#0f766e', '#dc2626'],
        borderWidth: 0,
      },
    ],
  };

  const classPerformanceData = {
    labels: topClasses.map((item) => item.name),
    datasets: [
      {
        label: 'Average Marks (%)',
        data: topClasses.map((item) => item.average),
        backgroundColor: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
        borderRadius: 16,
        borderSkipped: false,
      },
    ],
  };

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_52%,_#f8fafc_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-[1520px]">
          <div className="mb-6 rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  <FiShield />
                  Main Admin Command Center
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  One dashboard for the whole school system.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  This main dashboard now brings together academics, finance, library,
                  transport, hostel, admissions, communication, and safety so the admin
                  can monitor the full ERP from one place while role dashboards stay
                  focused on their own work.
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm sm:min-w-[360px]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {isConnected ? 'Realtime connected' : 'Auto-refresh fallback'}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <FiClock />
                    Every {dashboard.systemStatus.autoRefreshSeconds}s
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Last sync
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {dashboard.generatedAt
                        ? format(new Date(dashboard.generatedAt), 'dd MMM yyyy, hh:mm a')
                        : 'Waiting for first sync'}
                    </p>
                  </div>
                  <SchoolClock />
                </div>

                <button
                  type="button"
                  onClick={() => fetchDashboard(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                  Refresh system snapshot
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {overviewCards.map((card) => (
              <OverviewCard key={card.label} {...card} />
            ))}
          </div>

          <div className="mt-8">
            <SectionPanel
              title="Integrated Module Overview"
              subtitle="Every major system component reflects here, while each dedicated dashboard remains role-specific."
            >
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                {moduleCards.map((card) => (
                  <ModuleCard key={card.title} {...card} />
                ))}
              </div>
            </SectionPanel>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
            <SectionPanel
              title="Attendance Pulse"
              subtitle="Latest marked day across the school."
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="mx-auto h-64 w-full max-w-[260px]">
                  <Doughnut
                    data={attendanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '72%',
                      plugins: {
                        legend: { position: 'bottom' },
                      },
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 self-center">
                  <div className="rounded-3xl bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Present
                    </p>
                    <p className="mt-2 text-3xl font-black text-emerald-700">
                      {formatCompact(dashboard.attendance.present)}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                      Absent
                    </p>
                    <p className="mt-2 text-3xl font-black text-rose-700">
                      {formatCompact(dashboard.attendance.absent)}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-3xl bg-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Latest rate
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-4xl font-black text-slate-900">
                        {dashboard.attendance.rate}%
                      </p>
                      <div className="text-right text-sm text-slate-500">
                        {dashboard.attendance.asOf
                          ? format(new Date(dashboard.attendance.asOf), 'dd MMM yyyy')
                          : 'Not marked yet'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionPanel>

            <SectionPanel
              title="Top Performing Classes"
              subtitle="Average marks based on entered assessment records."
            >
              {topClasses.length ? (
                <div className="h-[320px]">
                  <Bar
                    data={classPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          suggestedMax: 100,
                          ticks: { color: '#64748b' },
                          grid: { color: 'rgba(148, 163, 184, 0.12)' },
                        },
                        x: {
                          ticks: { color: '#475569' },
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Marks data is not available yet for class performance.
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              title="Needs Attention"
              subtitle="The most urgent follow-up items across the system."
            >
              <div className="space-y-3">
                {attentionItems.length ? (
                  attentionItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={`block rounded-3xl border p-4 transition hover:-translate-y-0.5 ${attentionToneClasses[item.tone]}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-black">{formatCompact(item.count)}</p>
                          <p className="mt-1 text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs opacity-80">{item.description}</p>
                        </div>
                        {item.tone === 'danger' ? (
                          <FiTrendingUp className="mt-1 text-lg" />
                        ) : item.tone === 'warning' ? (
                          <FiAlertTriangle className="mt-1 text-lg" />
                        ) : (
                          <FiBell className="mt-1 text-lg" />
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">
                    Nothing urgent is open right now across the connected modules.
                  </div>
                )}

                {bottomClasses.length ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <FiTrendingDown />
                      Classes needing academic support
                    </div>
                    <div className="space-y-2">
                      {bottomClasses.map((item) => (
                        <div
                          key={item.classId}
                          className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <span className="font-black text-rose-600">{item.average}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionPanel>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionPanel
              title="Recent System Activity"
              subtitle="Cross-module activity feed from users, admissions, finance, hostel, and safety."
            >
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-3xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : recentActivities.length ? (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <Link
                      key={activity.id}
                      to={activity.href || '/admin/dashboard'}
                      className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        {activity.module === 'finance' ? (
                          <FiDollarSign />
                        ) : activity.module === 'safety' ? (
                          <FiShield />
                        ) : activity.module === 'hostel' ? (
                          <FiHome />
                        ) : activity.module === 'admissions' ? (
                          <FiLayers />
                        ) : activity.module === 'announcements' ? (
                          <FiBell />
                        ) : (
                          <FiUsers />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2 py-1 font-semibold capitalize text-slate-600">
                            {activity.module}
                          </span>
                          <span>
                            {activity.time
                              ? formatDistanceToNow(new Date(activity.time), {
                                  addSuffix: true,
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No recent platform activity is available yet.
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              title="Upcoming Work"
              subtitle="What is coming soon from connected academic workflows."
            >
              <div className="space-y-3">
                {upcomingEvents.length ? (
                  upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={event.href || '/admin/dashboard'}
                      className="block rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {event.type === 'exam' ? <FiBookOpen /> : <FiCalendar />}
                            {event.type}
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-900">
                            {event.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{event.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">
                            {event.date
                              ? format(new Date(event.date), 'dd MMM')
                              : 'TBD'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {event.date
                              ? format(new Date(event.date), 'hh:mm a')
                              : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No upcoming assignments or exams are scheduled right now.
                  </div>
                )}
              </div>
            </SectionPanel>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
*/
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiCloud,
  FiDatabase,
  FiDollarSign,
  FiExternalLink,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiPieChart,
  FiRefreshCw,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiUserCheck,
  FiUsers,
  FiZap,
  FiMonitor,
} from 'react-icons/fi';
import Layout from '../../components/common/Layout';
import SchoolClock from '../../components/SchoolClock';
import WeatherMiniWidget from '../../components/weather/WeatherMiniWidget';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip
);
const emptyDashboard = {
  generatedAt: null,
  systemStatus: {
    realtime: false,
    autoRefreshSeconds: 30,
  },
  overview: {
    people: {
      totalUsers: 0,
      students: 0,
      teachers: 0,
      parents: 0,
      classes: 0,
      admins: 0,
      wardens: 0,
      librarians: 0,
    },
    academics: {
      assignmentsDueSoon: 0,
      examsUpcoming: 0,
      attendanceRate: 0,
      averagePerformance: 0,
    },
    finance: {
      monthlyCollection: 0,
      totalCollection: 0,
      billedAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      paidAccounts: 0,
      partialAccounts: 0,
      pendingAccounts: 0,
      unpaidAccounts: 0,
    },
    library: {
      titles: 0,
      copies: 0,
      availableCopies: 0,
      issuedLoans: 0,
      overdueLoans: 0,
    },
    transport: {
      routes: 0,
      activeRoutes: 0,
      vehicles: 0,
      activeVehicles: 0,
      activeAllocations: 0,
    },
    hostel: {
      totalHostels: 0,
      activeHostels: 0,
      activeResidents: 0,
      pendingApplications: 0,
      openComplaints: 0,
      pendingLeaves: 0,
    },
    safety: {
      totalAlerts: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      totalIncidents: 0,
      pendingIncidents: 0,
      emergencyContacts: 0,
    },
    admissions: {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
    },
    communication: {
      announcements: 0,
      unreadMessages: 0,
      messagesLast7Days: 0,
    },
  },
  recentActivities: [],
  upcomingEvents: [],
  attentionItems: [],
  attendance: {
    present: 0,
    absent: 0,
    rate: 0,
    asOf: null,
  },
  topClasses: [],
  bottomClasses: [],
};
const cx = (...classes) => classes.filter(Boolean).join(' ');
const cardToneClasses = {
  blue: 'from-blue-600 via-sky-500 to-cyan-400 shadow-blue-500/20',
  emerald: 'from-emerald-600 via-green-500 to-teal-400 shadow-emerald-500/20',
  amber: 'from-amber-500 via-orange-500 to-yellow-400 shadow-amber-500/20',
  rose: 'from-rose-500 via-red-500 to-pink-500 shadow-rose-500/20',
  violet: 'from-violet-600 via-purple-500 to-fuchsia-500 shadow-violet-500/20',
  slate: 'from-slate-700 via-slate-600 to-slate-500 shadow-slate-500/20',
};
const softToneClasses = {
  blue: 'border-blue-200/80 bg-blue-50/80 text-blue-700',
  emerald: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700',
  amber: 'border-amber-200/80 bg-amber-50/80 text-amber-700',
  rose: 'border-rose-200/80 bg-rose-50/80 text-rose-700',
  violet: 'border-violet-200/80 bg-violet-50/80 text-violet-700',
  slate: 'border-slate-200/80 bg-slate-100/80 text-slate-700',
};
const moduleAccentClasses = {
  blue: 'border-blue-200/80 bg-blue-50/90 text-blue-700 ring-blue-100',
  emerald: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700 ring-emerald-100',
  amber: 'border-amber-200/80 bg-amber-50/90 text-amber-700 ring-amber-100',
  rose: 'border-rose-200/80 bg-rose-50/90 text-rose-700 ring-rose-100',
  violet: 'border-violet-200/80 bg-violet-50/90 text-violet-700 ring-violet-100',
  slate: 'border-slate-200/80 bg-slate-100/90 text-slate-700 ring-slate-100',
};
const attentionToneClasses = {
  danger: 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100/60',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100/60',
  info: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100/60',
};
const statusToneClasses = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
};
const shellClasses = {
  page: [
    'min-h-screen',
    'overflow-hidden',
    'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.11),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_50%,_#f8fafc_100%)]',
    'px-3',
    'py-5',
    'text-slate-900',
    'sm:px-4',
    'md:px-6',
    'lg:px-8',
  ],
  container: [
    'mx-auto',
    'max-w-[1600px]',
  ],
  glassPanel: [
    'border',
    'border-white/70',
    'bg-white/82',
    'shadow-[0_24px_80px_rgba(15,23,42,0.10)]',
    'backdrop-blur-2xl',
  ],
  smallGlassPanel: [
    'border',
    'border-white/70',
    'bg-white/86',
    'shadow-[0_18px_55px_rgba(15,23,42,0.08)]',
    'backdrop-blur-xl',
  ],
};
const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const formatCompact = (value) => Number(value || 0).toLocaleString();
const getFinanceOpenAccounts = (finance) =>
  Number(finance.partialAccounts || 0) +
  Number(finance.pendingAccounts || 0) +
  Number(finance.unpaidAccounts || 0);
const getModuleIcon = (module) => {
  if (module === 'finance') {
    return FiDollarSign;
  }
  if (module === 'safety') {
    return FiShield;
  }
  if (module === 'hostel') {
    return FiHome;
  }
  if (module === 'admissions') {
    return FiLayers;
  }
  if (module === 'announcements') {
    return FiBell;
  }
  if (module === 'library') {
    return FiBookOpen;
  }
  if (module === 'transport') {
    return FiTruck;
  }
  return FiUsers;
};
const Badge = ({ icon: Icon, children, tone = 'blue', className = '' }) => (
  <span
    className={cx(
      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]',
      softToneClasses[tone],
      className
    )}
  >
    {Icon ? <Icon className="text-sm" /> : null}
    {children}
  </span>
);
const EmptyState = ({ icon: Icon = FiDatabase, title, description }) => (
  <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
      <Icon className="text-2xl" />
    </div>
    <h3 className="mt-4 text-base font-black text-slate-800">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
  </div>
);
const LoadingRows = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="h-20 animate-pulse rounded-[26px] bg-slate-100/90"
      />
    ))}
  </div>
);
const PanelHeader = ({ eyebrow, title, subtitle, action, icon: Icon }) => (
  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? (
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {Icon ? <Icon className="text-sm" /> : null}
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">{title}</h2>
      {subtitle ? (
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
const SectionPanel = ({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  icon,
  className = '',
  compact = false,
}) => (
  <section
    className={cx(
      'rounded-[34px]',
      compact ? 'p-5' : 'p-5 md:p-6',
      ...shellClasses.smallGlassPanel,
      className
    )}
  >
    <PanelHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      action={action}
      icon={icon}
    />
    {children}
  </section>
);
const StatusChip = ({ tone = 'neutral', icon: Icon, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
      statusToneClasses[tone]
    )}
  >
    {Icon ? <Icon className="text-sm" /> : null}
    {children}
  </span>
);
const MetricTile = ({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'blue',
  compact = false,
}) => (
  <div
    className={cx(
      'group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]',
      compact ? 'min-h-[120px]' : 'min-h-[150px]'
    )}
  >
    <div
      className={cx(
        'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-10 blur-2xl',
        cardToneClasses[tone]
      )}
    />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p
          className={cx(
            'mt-3 truncate font-black tracking-tight text-slate-950',
            compact ? 'text-2xl' : 'text-3xl'
          )}
        >
          {value}
        </p>
        {helper ? (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{helper}</p>
        ) : null}
      </div>
      <div
        className={cx(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl transition duration-200 group-hover:scale-105',
          cardToneClasses[tone]
        )}
      >
        <Icon className="text-xl" />
      </div>
    </div>
  </div>
);
const OverviewCard = ({ icon, label, value, hint, tone = 'blue', trend, footer }) => (
  <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(15,23,42,0.12)]">
    <div
      className={cx(
        'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-10 blur-2xl',
        cardToneClasses[tone]
      )}
    />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-3 truncate text-3xl font-black tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{hint}</p>
      </div>
      <div
        className={cx(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl',
          cardToneClasses[tone]
        )}
      >
        {icon}
      </div>
    </div>
    {trend || footer ? (
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {trend ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <FiTrendingUp />
            {trend}
          </span>
        ) : (
          <span />
        )}
        {footer ? <span className="text-xs font-semibold text-slate-400">{footer}</span> : null}
      </div>
    ) : null}
  </div>
);
const HeroStat = ({ label, value, helper, tone = 'blue', icon: Icon }) => (
  <div className="rounded-[26px] border border-white/70 bg-white/88 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div
        className={cx(
          'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
          cardToneClasses[tone]
        )}
      >
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-xl font-black text-slate-950">{value}</p>
      </div>
    </div>
    {helper ? <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p> : null}
  </div>
);
const SystemRefreshPanel = ({
  isConnected,
  dashboard,
  refreshing,
  fetchDashboard,
}) => (
  <div className="rounded-[30px] border border-slate-200/80 bg-slate-50/90 p-5 shadow-inner shadow-white/60">
    <div className="flex flex-wrap items-center gap-3">
      <StatusChip
        tone={isConnected ? 'good' : 'warning'}
        icon={isConnected ? FiZap : FiClock}
      >
        {isConnected ? 'Realtime connected' : 'Auto-refresh fallback'}
      </StatusChip>
      <StatusChip tone="neutral" icon={FiClock}>
        Every {dashboard.systemStatus.autoRefreshSeconds}s
      </StatusChip>
    </div>
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Last system sync
        </p>
        <p className="mt-1 text-sm font-bold text-slate-700">
          {dashboard.generatedAt
            ? format(new Date(dashboard.generatedAt), 'dd MMM yyyy, hh:mm a')
            : 'Waiting for first sync'}
        </p>
      </div>
      <SchoolClock />
    </div>
    <button
      type="button"
      onClick={() => fetchDashboard(false)}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
    >
      <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
      Refresh system snapshot
    </button>
  </div>
);
const HeroPanel = ({
  overview,
  dashboard,
  isConnected,
  refreshing,
  fetchDashboard,
}) => {
  const totalPeople =
    Number(overview.people.students || 0) +
    Number(overview.people.teachers || 0) +
    Number(overview.people.parents || 0);
  return (
    <div
      className={cx(
        'relative mb-6 overflow-hidden rounded-[38px] p-5 md:p-7',
        ...shellClasses.glassPanel
      )}
    >
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-12 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <Badge icon={FiShield} tone="blue">
              Main Admin Command Center
            </Badge>
            <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              A cleaner, sharper, and fully modern school ERP overview.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Monitor academics, fees, admissions, safety, hostel, transport, library,
              communication, and activity signals from one executive-level dashboard without
              changing the existing data flow.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <HeroStat
              label="People"
              value={formatCompact(totalPeople)}
              helper="Students, teachers, and parents connected."
              tone="blue"
              icon={FiUsers}
            />
            <HeroStat
              label="Attendance"
              value={`${overview.academics.attendanceRate}%`}
              helper="Latest academic presence signal."
              tone="emerald"
              icon={FiCheckCircle}
            />
            <HeroStat
              label="Open Alerts"
              value={formatCompact(overview.safety.activeAlerts)}
              helper="Active items requiring leadership view."
              tone={overview.safety.activeAlerts ? 'rose' : 'slate'}
              icon={FiAlertTriangle}
            />
          </div>
        </div>
        <SystemRefreshPanel
          isConnected={isConnected}
          dashboard={dashboard}
          refreshing={refreshing}
          fetchDashboard={fetchDashboard}
        />
      </div>
    </div>
  );
};
const ModuleStat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-2 truncate text-base font-black text-slate-950">{value}</p>
  </div>
);
const ModuleCard = ({
  title,
  description,
  icon: Icon,
  href,
  accent = 'blue',
  stats,
}) => (
  <div className="group relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50/70 p-5 transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
    <div
      className={cx(
        'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl',
        cardToneClasses[accent]
      )}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div
        className={cx(
          'flex h-13 w-13 items-center justify-center rounded-2xl border p-3 ring-4',
          moduleAccentClasses[accent]
        )}
      >
        <Icon className="text-xl" />
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
      >
        Open
        <FiExternalLink />
      </Link>
    </div>
    <div className="relative mt-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-500">{description}</p>
    </div>
    <div className="relative mt-5 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <ModuleStat
          key={stat.label}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  </div>
);
const AttendancePanel = ({ dashboard }) => {
  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [dashboard.attendance.present, dashboard.attendance.absent],
        backgroundColor: ['#0f766e', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };
  return (
    <SectionPanel
      eyebrow="Daily pulse"
      title="Attendance Pulse"
      subtitle="Latest marked attendance record across the school."
      icon={FiPieChart}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto h-72 w-full max-w-[290px]">
          <Doughnut
            data={attendanceChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '74%',
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,
                    color: '#475569',
                    font: {
                      weight: '700',
                    },
                  },
                },
              },
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
            <div className="text-center">
              <p className="text-4xl font-black text-slate-950">{dashboard.attendance.rate}%</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Rate
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 self-center">
          <MetricTile
            label="Present"
            value={formatCompact(dashboard.attendance.present)}
            helper="Students marked present"
            icon={FiCheckCircle}
            tone="emerald"
          />
          <MetricTile
            label="Absent"
            value={formatCompact(dashboard.attendance.absent)}
            helper="Students marked absent"
            icon={FiAlertTriangle}
            tone="rose"
          />
          <div className="col-span-2 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Latest marked date
            </p>
            <p className="mt-3 text-2xl font-black text-slate-950">
              {dashboard.attendance.asOf
                ? format(new Date(dashboard.attendance.asOf), 'dd MMM yyyy')
                : 'Not marked yet'}
            </p>
          </div>
        </div>
      </div>
    </SectionPanel>
  );
};
const PerformancePanel = ({ topClasses }) => {
  const classPerformanceData = {
    labels: topClasses.map((item) => item.name),
    datasets: [
      {
        label: 'Average Marks (%)',
        data: topClasses.map((item) => item.average),
        backgroundColor: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
        borderRadius: 18,
        borderSkipped: false,
      },
    ],
  };
  return (
    <SectionPanel
      eyebrow="Academics"
      title="Top Performing Classes"
      subtitle="Average marks based on entered assessment records."
      icon={FiBarChart2}
    >
      {topClasses.length ? (
        <div className="h-[340px]">
          <Bar
            data={classPerformanceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#ffffff',
                  bodyColor: '#e2e8f0',
                  padding: 12,
                  cornerRadius: 12,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  suggestedMax: 100,
                  ticks: {
                    color: '#64748b',
                    font: {
                      weight: '700',
                    },
                  },
                  grid: {
                    color: 'rgba(148, 163, 184, 0.14)',
                  },
                },
                x: {
                  ticks: {
                    color: '#475569',
                    font: {
                      weight: '700',
                    },
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <EmptyState
          icon={FiAward}
          title="No performance data yet"
          description="Marks data is not available yet for class performance."
        />
      )}
    </SectionPanel>
  );
};
const AttentionCard = ({ item }) => {
  const Icon =
    item.tone === 'danger'
      ? FiTrendingUp
      : item.tone === 'warning'
        ? FiAlertTriangle
        : FiBell;
  return (
    <Link
      key={item.key}
      to={item.href}
      className={cx(
        'block rounded-[28px] border p-4 transition duration-200 hover:-translate-y-0.5',
        attentionToneClasses[item.tone]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-black">{formatCompact(item.count)}</p>
          <p className="mt-1 text-sm font-black">{item.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
        </div>
        <Icon className="mt-1 shrink-0 text-lg" />
      </div>
    </Link>
  );
};
const AttentionPanel = ({ attentionItems, bottomClasses }) => (
  <SectionPanel
    eyebrow="Priority"
    title="Needs Attention"
    subtitle="Urgent items are separated for fast admin follow-up."
    icon={FiAlertTriangle}
  >
    <div className="space-y-3">
      {attentionItems.length ? (
        attentionItems.map((item) => (
          <AttentionCard
            key={item.key}
            item={item}
          />
        ))
      ) : (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
          Nothing urgent is open right now across the connected modules.
        </div>
      )}
      {bottomClasses.length ? (
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-600">
            <FiTrendingDown />
            Classes needing academic support
          </div>
          <div className="space-y-2">
            {bottomClasses.map((item) => (
              <div
                key={item.classId}
                className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm"
              >
                <span className="font-bold text-slate-700">{item.name}</span>
                <span className="font-black text-rose-600">{item.average}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  </SectionPanel>
);
const ActivityItem = ({ activity }) => {
  const Icon = getModuleIcon(activity.module);
  return (
    <Link
      to={activity.href || '/admin/dashboard'}
      className="group flex items-start gap-4 rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-950">{activity.action}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1 font-black capitalize text-slate-600 shadow-sm">
            {activity.module}
          </span>
          <span className="font-semibold">
            {activity.time
              ? formatDistanceToNow(new Date(activity.time), {
                  addSuffix: true,
                })
              : 'Recently'}
          </span>
        </div>
      </div>
      <FiExternalLink className="mt-1 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
    </Link>
  );
};
const ActivityFeed = ({ loading, recentActivities }) => (
  <SectionPanel
    eyebrow="Timeline"
    title="Recent System Activity"
    subtitle="Cross-module activity feed from users, admissions, finance, hostel, and safety."
    icon={FiActivity}
  >
    {loading ? (
      <LoadingRows count={6} />
    ) : recentActivities.length ? (
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </div>
    ) : (
      <EmptyState
        icon={FiActivity}
        title="No recent activity"
        description="No recent platform activity is available yet."
      />
    )}
  </SectionPanel>
);
const UpcomingEventItem = ({ event }) => (
  <Link
    to={event.href || '/admin/dashboard'}
    className="group block rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm">
          {event.type === 'exam' ? <FiBookOpen /> : <FiCalendar />}
          {event.type}
        </div>
        <p className="mt-3 text-sm font-black text-slate-950">{event.title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{event.subtitle}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-slate-950">
          {event.date ? format(new Date(event.date), 'dd MMM') : 'TBD'}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {event.date ? format(new Date(event.date), 'hh:mm a') : ''}
        </p>
      </div>
    </div>
  </Link>
);
const UpcomingWork = ({ upcomingEvents }) => (
  <SectionPanel
    eyebrow="Schedule"
    title="Upcoming Work"
    subtitle="What is coming soon from connected academic workflows."
    icon={FiCalendar}
  >
    <div className="space-y-3">
      {upcomingEvents.length ? (
        upcomingEvents.map((event) => (
          <UpcomingEventItem
            key={event.id}
            event={event}
          />
        ))
      ) : (
        <EmptyState
          icon={FiCalendar}
          title="Nothing scheduled"
          description="No upcoming assignments or exams are scheduled right now."
        />
      )}
    </div>
  </SectionPanel>
);
const ModuleOverviewPanel = ({ moduleCards }) => (
  <SectionPanel
    eyebrow="Modules"
    title="Integrated Module Overview"
    subtitle="Every major system component reflects here, while each dedicated dashboard remains role-specific."
    icon={FiLayers}
  >
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-4">
      {moduleCards.map((card) => (
        <ModuleCard
          key={card.title}
          {...card}
        />
      ))}
    </div>
  </SectionPanel>
);
const ErrorBanner = ({ error }) => {
  if (!error) {
    return null;
  }
  return (
    <div className="mb-6 rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
        <span>{error}</span>
      </div>
    </div>
  );
};
const AdminDashboard = () => {
  const { socket, isConnected } = useSocket();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchDashboard = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const { data } = await api.get('/dashboard/admin');
      setDashboard({
        ...emptyDashboard,
        ...data,
      });
      setError('');
    } catch (err) {
      console.error('Failed to fetch admin dashboard', err);
      setError(
        err?.response?.data?.message || 'Unable to load the main admin dashboard right now.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchDashboard(true);
    const intervalId = window.setInterval(() => {
      fetchDashboard(false);
    }, (dashboard.systemStatus.autoRefreshSeconds || 30) * 1000);
    const handleFocus = () => fetchDashboard(false);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  useEffect(() => {
    if (!socket) {
      return undefined;
    }
    const handleDashboardRefresh = () => {
      fetchDashboard(false);
    };
    socket.on('dashboard:refresh', handleDashboardRefresh);
    return () => {
      socket.off('dashboard:refresh', handleDashboardRefresh);
    };
  }, [socket]);
  const {
    overview,
    recentActivities,
    upcomingEvents,
    attentionItems,
    topClasses,
    bottomClasses,
  } = dashboard;
  const overviewCards = useMemo(
    () => [
      {
        label: 'Students',
        value: formatCompact(overview.people.students),
        hint: `${formatCompact(overview.people.classes)} classes currently running`,
        icon: <FiUsers className="text-2xl" />,
        tone: 'blue',
        footer: 'Learners',
      },
      {
        label: 'Teachers',
        value: formatCompact(overview.people.teachers),
        hint: `${formatCompact(overview.people.totalUsers)} total platform accounts`,
        icon: <FiUserCheck className="text-2xl" />,
        tone: 'emerald',
        footer: 'Faculty',
      },
      {
        label: 'Parents',
        value: formatCompact(overview.people.parents),
        hint: `${formatCompact(overview.communication.announcements)} announcements published`,
        icon: <FiHome className="text-2xl" />,
        tone: 'violet',
        footer: 'Guardians',
      },
      {
        label: 'Attendance',
        value: `${overview.academics.attendanceRate}%`,
        hint: dashboard.attendance.asOf
          ? `Latest marked day: ${format(new Date(dashboard.attendance.asOf), 'dd MMM yyyy')}`
          : 'No attendance records marked yet',
        icon: <FiCheckCircle className="text-2xl" />,
        tone: 'amber',
        footer: 'Daily pulse',
      },
      {
        label: 'Monthly Collection',
        value: formatCurrency(overview.finance.monthlyCollection),
        hint: `${formatCurrency(overview.finance.outstandingAmount)} still outstanding`,
        icon: <FiDollarSign className="text-2xl" />,
        tone: 'emerald',
        footer: 'Finance',
      },
      {
        label: 'Active Alerts',
        value: formatCompact(overview.safety.activeAlerts),
        hint: `${formatCompact(overview.safety.pendingIncidents)} unresolved incidents`,
        icon: <FiAlertTriangle className="text-2xl" />,
        tone: overview.safety.activeAlerts ? 'rose' : 'slate',
        footer: 'Safety',
      },
    ],
    [overview, dashboard.attendance.asOf]
  );
  const moduleCards = useMemo(
    () => [
      {
        title: 'Academics',
        description: 'Assignments, exams, attendance, and performance in one view.',
        icon: FiBookOpen,
        href: '/admin/analytics',
        accent: 'blue',
        stats: [
          {
            label: 'Assignments',
            value: formatCompact(overview.academics.assignmentsDueSoon),
          },
          {
            label: 'Exams',
            value: formatCompact(overview.academics.examsUpcoming),
          },
          {
            label: 'Avg Score',
            value: `${overview.academics.averagePerformance}%`,
          },
        ],
      },
      {
        title: 'Admissions',
        description: 'Track intake movement from pending to accepted.',
        icon: FiLayers,
        href: '/admin/admissions',
        accent: 'amber',
        stats: [
          {
            label: 'Pending',
            value: formatCompact(overview.admissions.pending),
          },
          {
            label: 'Accepted',
            value: formatCompact(overview.admissions.accepted),
          },
          {
            label: 'Rejected',
            value: formatCompact(overview.admissions.rejected),
          },
        ],
      },
      {
        title: 'Finance',
        description: 'Collection momentum, billing, and outstanding balances.',
        icon: FiDollarSign,
        href: '/admin/reports/collection',
        accent: 'emerald',
        stats: [
          {
            label: 'Collected',
            value: formatCurrency(overview.finance.monthlyCollection),
          },
          {
            label: 'Outstanding',
            value: formatCurrency(overview.finance.outstandingAmount),
          },
          {
            label: 'Open Accts',
            value: formatCompact(getFinanceOpenAccounts(overview.finance)),
          },
        ],
      },
      {
        title: 'Library',
        description: 'Inventory, circulation, and overdue monitoring.',
        icon: FiBookOpen,
        href: '/library/dashboard',
        accent: 'violet',
        stats: [
          {
            label: 'Titles',
            value: formatCompact(overview.library.titles),
          },
          {
            label: 'Issued',
            value: formatCompact(overview.library.issuedLoans),
          },
          {
            label: 'Overdue',
            value: formatCompact(overview.library.overdueLoans),
          },
        ],
      },
      {
        title: 'Transport',
        description: 'Vehicle readiness, routes, and active allocations.',
        icon: FiTruck,
        href: '/admin/transport',
        accent: 'blue',
        stats: [
          {
            label: 'Vehicles',
            value: formatCompact(overview.transport.activeVehicles),
          },
          {
            label: 'Routes',
            value: formatCompact(overview.transport.activeRoutes),
          },
          {
            label: 'Riders',
            value: formatCompact(overview.transport.activeAllocations),
          },
        ],
      },
      {
        title: 'Hostel',
        description: 'Residents, applications, and issue flow across hostels.',
        icon: FiHome,
        href: '/admin/hostel-analytics',
        accent: 'amber',
        stats: [
          {
            label: 'Residents',
            value: formatCompact(overview.hostel.activeResidents),
          },
          {
            label: 'Applications',
            value: formatCompact(overview.hostel.pendingApplications),
          },
          {
            label: 'Complaints',
            value: formatCompact(overview.hostel.openComplaints),
          },
        ],
      },
      {
        title: 'Safety',
        description: 'Alerts, incidents, and emergency readiness from one place.',
        icon: FiShield,
        href: '/admin/safety-dashboard',
        accent: 'rose',
        stats: [
          {
            label: 'Active',
            value: formatCompact(overview.safety.activeAlerts),
          },
          {
            label: 'Critical',
            value: formatCompact(overview.safety.criticalAlerts),
          },
          {
            label: 'Contacts',
            value: formatCompact(overview.safety.emergencyContacts),
          },
        ],
      },
      {
        title: 'Communication',
        description: 'Announcements and platform messaging activity.',
        icon: FiMessageSquare,
        href: '/admin/messages',
        accent: 'slate',
        stats: [
          {
            label: 'Unread',
            value: formatCompact(overview.communication.unreadMessages),
          },
          {
            label: '7 Days',
            value: formatCompact(overview.communication.messagesLast7Days),
          },
          {
            label: 'Alerts',
            value: formatCompact(overview.communication.announcements),
          },
        ],
      },
      {
        title: 'Weather Intelligence',
        description: 'Live campus weather, AQI, alerts, transport risk, and hostel environment in one module.',
        icon: FiCloud,
        href: '/admin/weather',
        accent: 'blue',
        stats: [
          {
            label: 'Command',
            value: 'Center',
          },
          {
            label: 'Forecast',
            value: '24H / 7D',
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
      {
        title: 'HR & Payroll',
        description: 'Dedicated staff operations with directory visibility, attendance readiness, payroll control, and admin workflow coverage.',
        icon: FiUserCheck,
        href: '/admin/hr-payroll',
        accent: 'emerald',
        stats: [
          {
            label: 'Staff',
            value: formatCompact(
              overview.people.teachers +
                overview.people.admins +
                overview.people.wardens +
                overview.people.librarians
            ),
          },
          {
            label: 'Teachers',
            value: formatCompact(overview.people.teachers),
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
      {
        title: 'Inventory & Procurement',
        description: 'Stock control, vendors, purchase requests, purchase orders, store issue and return, and maintenance activity in one operations module.',
        icon: FiClipboard,
        href: '/admin/inventory',
        accent: 'emerald',
        stats: [
          {
            label: 'Stock',
            value: 'Live',
          },
          {
            label: 'Orders',
            value: 'PO',
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
      {
        title: 'Admin Operations',
        description: 'Budget control, approvals, compliance, clinic and security oversight, BI reporting, and leadership command surfaces.',
        icon: FiActivity,
        href: '/admin/operations',
        accent: 'blue',
        stats: [
          {
            label: 'Approvals',
            value: formatCompact(overview.safety.pendingIncidents + overview.communication.unreadMessages),
          },
          {
            label: 'Finance',
            value: formatCurrency(overview.finance.monthlyCollection),
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
      {
        title: 'System Monitor',
        description: 'Monitor school-wide activity, module signals, alerts, and live system connectivity.',
        icon: FiMonitor,
        href: '/admin/monitor',
        accent: 'slate',
        stats: [
          { label: 'Modules', value: '9' },
          { label: 'Updates', value: 'Live' },
          { label: 'Access', value: 'Admin' },
        ],
      },
      {
        title: 'Accounts & General Ledger',
        description: 'Dedicated accounting with ledgers, vouchers, cash and bank books, hostel and transport income, and finance statements.',
        icon: FiDollarSign,
        href: '/admin/accounts-ledger',
        accent: 'rose',
        stats: [
          {
            label: 'Collected',
            value: formatCurrency(overview.finance.monthlyCollection),
          },
          {
            label: 'Outstanding',
            value: formatCurrency(overview.finance.outstandingAmount),
          },
          {
            label: 'Ledger',
            value: 'Live',
          },
        ],
      },
      {
        title: 'Medical & Clinic',
        description: 'Medical profiles, clinic visits, medicine logs, parent alerts, and hostel-linked health incidents in one care module.',
        icon: FiActivity,
        href: '/admin/medical-clinic',
        accent: 'rose',
        stats: [
          {
            label: 'Students',
            value: formatCompact(overview.people.students),
          },
          {
            label: 'Alerts',
            value: formatCompact(overview.safety.pendingIncidents),
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
      {
        title: 'Gate Pass & Security',
        description: 'Visitor entry, gate passes, vehicle logs, and emergency notices for full campus access control.',
        icon: FiShield,
        href: '/admin/security-gate',
        accent: 'slate',
        stats: [
          {
            label: 'Alerts',
            value: formatCompact(overview.safety.activeAlerts),
          },
          {
            label: 'Transport',
            value: formatCompact(overview.transport.activeVehicles),
          },
          {
            label: 'Access',
            value: 'Full',
          },
        ],
      },
    ],
    [overview]
  );
  return (
    <Layout role="admin">
      <div className={cx(...shellClasses.page)}>
        <div className={cx(...shellClasses.container)}>
          <HeroPanel
            overview={overview}
            dashboard={dashboard}
            isConnected={isConnected}
            refreshing={refreshing}
            fetchDashboard={fetchDashboard}
          />
          <ErrorBanner error={error} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {overviewCards.map((card) => (
              <OverviewCard
                key={card.label}
                {...card}
              />
            ))}
          </div>
          <div className="mt-8">
            <ModuleOverviewPanel moduleCards={moduleCards} />
          </div>
          <div className="mt-8">
            <SectionPanel
              eyebrow="Weather"
              title="Weather Intelligence Snapshot"
              subtitle="The full weather subsystem is available as a separate admin module and also feeds this main command center."
              icon={FiCloud}
            >
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <WeatherMiniWidget role="admin" />
                <div className="rounded-[28px] border border-sky-200 bg-sky-50/70 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Dedicated Module</p>
                  <h3 className="mt-3 text-xl font-black text-slate-950">Weather Intelligence</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Admin has full access to live weather, AQI monitoring, alerts, analytics, history, reports, settings, transport weather, hostel weather, and system health.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/admin/weather" className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                      Open Module
                    </Link>
                    <Link to="/admin/weather/live" className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
                      Live Center
                    </Link>
                  </div>
                </div>
              </div>
            </SectionPanel>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
            <AttendancePanel dashboard={dashboard} />
            <PerformancePanel topClasses={topClasses} />
            <AttentionPanel
              attentionItems={attentionItems}
              bottomClasses={bottomClasses}
            />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <ActivityFeed
              loading={loading}
              recentActivities={recentActivities}
            />
            <UpcomingWork upcomingEvents={upcomingEvents} />
          </div>
        </div>
      </div>
    </Layout>
  );
};














export default AdminDashboard;
