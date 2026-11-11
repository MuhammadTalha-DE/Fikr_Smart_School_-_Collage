import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CloudSun,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  UserRound,
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
import api from '../../services/api';
import { getParentWeatherSummary } from '../../services/weatherService';

const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

const getCurrentPeriod = () => {
  const now = new Date();
  const startHour = 8;
  const totalMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
  if (totalMinutes < 0) return 0;
  return Math.min(Math.ceil(totalMinutes / 45), 8);
};

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const calculateAverageMarks = (marksPayload) => {
  const subjectAverages = marksPayload?.subjectAverages || [];
  if (!subjectAverages.length) return 0;
  const total = subjectAverages.reduce((sum, item) => sum + Number(item.average || 0), 0);
  return Math.round(total / subjectAverages.length);
};

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [childDashboardMap, setChildDashboardMap] = useState({});

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      const [profileRes, announcementsRes, weatherRes] = await Promise.allSettled([
        api.get('/users/profile'),
        api.get('/announcements'),
        getParentWeatherSummary(),
      ]);

      const childrenList = profileRes.status === 'fulfilled'
        ? profileRes.value.data?.parent?.children || []
        : [];

      setChildren(childrenList);

      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements(
          (announcementsRes.value.data || [])
            .filter((item) => item.targetRole === 'all' || item.targetRole === 'parent')
            .slice(0, 4)
        );
      }

      if (weatherRes.status === 'fulfilled') {
        setWeatherSummary(weatherRes.value.data?.data || null);
      }

      const results = await Promise.all(
        childrenList.map(async (child) => {
          const timetablePromise = child.classId?._id
            ? api.get(`/timetables/${child.classId._id}`, { params: { status: 'published', date: new Date().toISOString() } })
            : Promise.resolve({ data: { slots: [] } });

          const [
            timetableRes,
            attendanceRes,
            marksRes,
            behaviourRes,
            feesRes,
          ] = await Promise.allSettled([
            timetablePromise,
            api.get(`/students/${child._id}/attendance`),
            api.get(`/students/${child._id}/marks`),
            api.get(`/behaviour/child/${child._id}/summary`),
            api.get('/fee-accounts/parent', { params: { studentId: child._id } }),
          ]);

          const timetable = timetableRes.status === 'fulfilled' ? timetableRes.value.data || { slots: [] } : { slots: [] };
          const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data || null : null;
          const marks = marksRes.status === 'fulfilled' ? marksRes.value.data || null : null;
          const behaviour = behaviourRes.status === 'fulfilled'
            ? behaviourRes.value.data?.summary || behaviourRes.value.data || null
            : null;
          const feeAccounts = feesRes.status === 'fulfilled' ? feesRes.value.data?.accounts || [] : [];

          return [
            child._id,
            {
              timetable,
              attendance,
              marks,
              behaviour,
              feeAccounts,
            },
          ];
        })
      );

      setChildDashboardMap(Object.fromEntries(results));
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const childCards = useMemo(() => {
    const activePeriod = getCurrentPeriod();

    return children.map((child) => {
      const childData = childDashboardMap[child._id] || {};
      const todaySlots = (childData.timetable?.slots || [])
        .filter((slot) => slot.day === getTodayName())
        .sort((a, b) => (a.period || 0) - (b.period || 0));
      const currentSlot = todaySlots.find((slot) => Number(slot.period) === activePeriod) || null;
      const nextSlot = todaySlots.find((slot) => Number(slot.period) > activePeriod) || null;
      const attendancePct = Math.round(Number(childData.attendance?.percentage || 0));
      const averageMarks = calculateAverageMarks(childData.marks);
      const behaviourPoints = Number(childData.behaviour?.totalPoints || 0);
      const dueAmount = (childData.feeAccounts || []).reduce((sum, account) => sum + Number(account.dueAmount || 0), 0);

      return {
        child,
        todaySlots,
        currentSlot,
        nextSlot,
        attendancePct,
        averageMarks,
        behaviourPoints,
        dueAmount,
      };
    });
  }, [children, childDashboardMap]);

  const overallAttendance = useMemo(() => {
    if (!childCards.length) return 0;
    return Math.round(childCards.reduce((sum, item) => sum + item.attendancePct, 0) / childCards.length);
  }, [childCards]);

  const overallMarks = useMemo(() => {
    if (!childCards.length) return 0;
    return Math.round(childCards.reduce((sum, item) => sum + item.averageMarks, 0) / childCards.length);
  }, [childCards]);

  const totalDueAmount = useMemo(
    () => childCards.reduce((sum, item) => sum + item.dueAmount, 0),
    [childCards]
  );

  const weatherAdvice = weatherSummary?.advice || [];
  const weatherAlerts = weatherSummary?.alerts || [];

  if (loading) {
    return (
      <Layout role="parent">
        <div className="p-6 text-center text-slate-500">Loading parent dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout role="parent">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Parent Overview"
          title="Family progress at a glance"
          subtitle="Track attendance, learning momentum, fees, and safety updates for each child from a single modern parent workspace."
          meta={[
            `${children.length} linked children`,
            `${overallAttendance}% average attendance`,
            `${overallMarks}% average marks`,
            `${formatCurrency(totalDueAmount)} due`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Users} label="Children" to="/parent/children" tone="blue" />
              <DashboardQuickLink icon={CreditCard} label="Fees" to="/parent/fees" tone="amber" />
              <DashboardQuickLink icon={CloudSun} label="Weather Safety" to="/parent/weather-safety" tone="sky" />
            </>
          }
        />

        <WeatherMiniWidget role="parent" compact />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Children" value={children.length} helper="Profiles linked to your account" tone="blue" />
          <DashboardStatCard icon={CalendarDays} label="Attendance" value={`${overallAttendance}%`} helper="Average across linked children" tone="emerald" />
          <DashboardStatCard icon={TrendingUp} label="Marks" value={`${overallMarks}%`} helper="Current academic average" tone="indigo" />
          <DashboardStatCard icon={CreditCard} label="Fees Due" value={formatCurrency(totalDueAmount)} helper="Outstanding balance across accounts" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={UserRound}
                title="Children Snapshot"
                subtitle="Attendance, marks, behaviour, fees, and today's timetable context"
                tone="blue"
              />

              {childCards.length ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {childCards.map(({ child, attendancePct, averageMarks, behaviourPoints, dueAmount, currentSlot, nextSlot }) => (
                    <div key={child._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-slate-950">{child.userId?.name || 'Student'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {child.classId?.name || 'Class not assigned'} - Roll {child.rollNumber || 'N/A'}
                          </p>
                        </div>
                        <Link to={`/parent/child/${child._id}`} className="text-xs font-bold text-blue-700 hover:text-blue-900">
                          Open
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs text-slate-500">Attendance</p>
                          <p className="mt-1 text-xl font-black text-slate-950">{attendancePct}%</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs text-slate-500">Average Marks</p>
                          <p className="mt-1 text-xl font-black text-slate-950">{averageMarks}%</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                            <span>Attendance progress</span>
                            <span>{attendancePct}%</span>
                          </div>
                          <DashboardProgressBar value={attendancePct} tone="emerald" />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                            <span>Academic progress</span>
                            <span>{averageMarks}%</span>
                          </div>
                          <DashboardProgressBar value={averageMarks} tone="indigo" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs text-slate-500">Behaviour Points</p>
                          <p className="mt-1 text-sm font-black text-slate-950">{behaviourPoints}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs text-slate-500">Fees Due</p>
                          <p className="mt-1 text-sm font-black text-slate-950">{formatCurrency(dueAmount)}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Today</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {currentSlot
                            ? `In class: ${currentSlot.subject}`
                            : nextSlot
                            ? `Next class: ${nextSlot.subject} at period ${nextSlot.period}`
                            : 'No more classes scheduled today'}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <DashboardQuickLink icon={GraduationCap} label="Progress" to={`/parent/child/${child._id}`} tone="indigo" />
                        <DashboardQuickLink icon={ShieldCheck} label="Behaviour" to={`/parent/child/${child._id}/behaviour`} tone="emerald" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Users} title="No linked children" subtitle="Child records linked to your account will appear here." />
              )}
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CloudSun} title="Child Weather Safety" subtitle="Parent-focused school weather advice and alerts" tone="sky" />
              {weatherAdvice.length || weatherAlerts.length ? (
                <div className="space-y-3">
                  {weatherAdvice.slice(0, 3).map((item, index) => (
                    <div key={`${item.text}-${index}`} className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-800">{item.text}</p>
                    </div>
                  ))}
                  {weatherAlerts.slice(0, 2).map((item) => (
                    <div key={item._id} className="rounded-3xl border border-amber-100 bg-amber-50/80 p-4">
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={CloudSun} title="No weather alerts" subtitle="Parent safety guidance will appear after the next successful weather sync." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={Bell}
                title="School Announcements"
                subtitle="Important notices for families"
                tone="amber"
                action={<Link to="/parent/announcements" className="text-xs font-bold text-amber-700 hover:text-amber-900">View all</Link>}
              />

              {announcements.length ? (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Bell} title="No announcements" subtitle="New school notices for parents will appear here." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={HeartHandshake} title="Parent Action Center" subtitle="Most common next steps" tone="violet" />
              <div className="flex flex-wrap gap-2">
                <DashboardQuickLink icon={BookOpen} label="Report Cards" to="/parent/report-cards" tone="indigo" />
                <DashboardQuickLink icon={CalendarDays} label="Attendance" to="/parent/attendance" tone="emerald" />
                <DashboardQuickLink icon={CreditCard} label="Pay Fees" to="/parent/fees" tone="amber" />
                <DashboardQuickLink icon={CloudSun} label="Transport" to="/parent/transport" tone="sky" />
                <DashboardQuickLink icon={Users} label="Workflow Center" to="/parent/workflows" tone="blue" />
                <DashboardQuickLink icon={ShieldCheck} label="Security Center" to="/parent/security-center" tone="violet" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ParentDashboard;
