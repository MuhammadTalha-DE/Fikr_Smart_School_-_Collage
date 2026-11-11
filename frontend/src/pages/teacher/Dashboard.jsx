import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlarmClock,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CloudSun,
  FileText,
  GraduationCap,
  LayoutGrid,
  Sparkles,
  Users,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherMiniWidget from '../../components/weather/WeatherMiniWidget';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardMiniMetric,
  DashboardProgressBar,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAttendanceStats } from '../../services/attendanceApi';
import { getTeacherWeatherSummary } from '../../services/weatherService';

const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

const getCurrentPeriod = () => {
  const now = new Date();
  const startHour = 8;
  const totalMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
  if (totalMinutes < 0) return 0;
  return Math.min(Math.ceil(totalMinutes / 45), 8);
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentLessonPlans, setRecentLessonPlans] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const { periods } = useSchoolPeriods();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      const [
        classesRes,
        announcementsRes,
        scheduleRes,
        assignmentsRes,
        examsRes,
        lessonsRes,
        attendanceRes,
        weatherRes,
      ] = await Promise.allSettled([
        api.get('/classes/my-classes'),
        api.get('/announcements'),
        api.get('/teachers/schedule'),
        api.get('/teacher/pending-assignments'),
        api.get('/teacher/upcoming-exams'),
        api.get('/teacher/recent-lessons'),
        getTeacherAttendanceStats(),
        getTeacherWeatherSummary(),
      ]);

      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.data || []);
      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements(
          (announcementsRes.value.data || [])
            .filter((item) => item.targetRole === 'all' || item.targetRole === 'teacher')
            .slice(0, 5)
        );
      }
      if (scheduleRes.status === 'fulfilled') setSchedule(scheduleRes.value.data || []);
      if (assignmentsRes.status === 'fulfilled') setPendingAssignments(assignmentsRes.value.data?.count || 0);
      if (examsRes.status === 'fulfilled') setUpcomingExams(examsRes.value.data || []);
      if (lessonsRes.status === 'fulfilled') setRecentLessonPlans(lessonsRes.value.data || []);
      if (attendanceRes.status === 'fulfilled') setAttendanceStats(attendanceRes.value.data || null);
      if (weatherRes.status === 'fulfilled') setWeatherSummary(weatherRes.value.data?.data || null);

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const todaySlots = useMemo(
    () => (schedule || [])
      .filter((slot) => slot.day === getTodayName())
      .sort((a, b) => (a.period || 0) - (b.period || 0)),
    [schedule]
  );

  const activePeriod = getCurrentPeriod();
  const currentSlot = useMemo(
    () => todaySlots.find((slot) => Number(slot.period) === activePeriod) || null,
    [todaySlots, activePeriod]
  );
  const nextSlot = useMemo(
    () => todaySlots.find((slot) => Number(slot.period) > activePeriod) || null,
    [todaySlots, activePeriod]
  );
  const freePeriods = useMemo(() => {
    const used = new Set(todaySlots.map((slot) => Number(slot.period)));
    return periods.filter((period) => !used.has(period));
  }, [todaySlots, periods]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, item) => sum + (item.students?.length || 0), 0),
    [classes]
  );

  const attendanceRate = attendanceStats?.percentage || 0;
  const weatherAdvice = weatherSummary?.advice || [];
  const weatherAlerts = weatherSummary?.alerts || [];

  if (loading) {
    return (
      <Layout role="teacher">
        <div className="p-6 text-center text-slate-500">Loading teacher dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Teacher Workspace"
          title={`Welcome back, ${user?.name || 'Teacher'}`}
          subtitle="Keep classes on track, move quickly between teaching tasks, and stay ahead of the day with a cleaner live overview."
          meta={[
            `${classes.length} classes`,
            `${totalStudents} students`,
            `${attendanceRate}% attendance record`,
            `${pendingAssignments} pending assignment queues`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={CheckSquare} label="Take Attendance" to="/teacher/attendance" tone="blue" />
              <DashboardQuickLink icon={ClipboardCheck} label="Enter Marks" to="/teacher/marks" tone="emerald" />
              <DashboardQuickLink icon={FileText} label="Lesson Planner" to="/teacher/lesson-planner" tone="violet" />
            </>
          }
        />

        <WeatherMiniWidget role="teacher" compact />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BookOpen} label="Classes" value={classes.length} helper="Assigned teaching groups" tone="blue" />
          <DashboardStatCard icon={Users} label="Students" value={totalStudents} helper="Across your active classes" tone="indigo" />
          <DashboardStatCard icon={ClipboardCheck} label="Pending Work" value={pendingAssignments} helper="Assignments waiting for response" tone="amber" />
          <DashboardStatCard icon={AlarmClock} label="Attendance" value={`${attendanceRate}%`} helper={`${attendanceStats?.present || 0} present records logged`} tone="emerald" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader
            icon={LayoutGrid}
            title="Teacher Operations"
            subtitle="New dedicated workflow surfaces for the teaching role"
            tone="violet"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickLink icon={Users} label="Teacher Workspace" to="/teacher/workspace" tone="blue" />
            <DashboardQuickLink icon={CheckSquare} label="HR Self-Service" to="/teacher/self-service" tone="emerald" />
            <DashboardQuickLink icon={FileText} label="Lesson Delivery" to="/teacher/lesson-delivery" tone="violet" />
            <DashboardQuickLink icon={Bell} label="Interventions" to="/teacher/interventions" tone="amber" />
            <DashboardQuickLink icon={CalendarDays} label="PTM Center" to="/teacher/ptm-center" tone="indigo" />
            <DashboardQuickLink icon={CloudSun} label="Learning Continuity" to="/teacher/learning-continuity" tone="slate" />
          </div>
        </DashboardCard>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={CalendarDays}
                title={`Today's Schedule - ${getTodayName()}`}
                subtitle="Current, next, and free teaching periods"
                tone="blue"
              />

              {currentSlot || nextSlot ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current Period</p>
                    {currentSlot ? (
                      <div className="mt-3">
                        <p className="text-xl font-black text-slate-950">{currentSlot.subject || 'Class in progress'}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {currentSlot.class || currentSlot.classId?.name || 'Assigned class'} - Period {currentSlot.period}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No active class right now.</p>
                    )}
                  </div>

                  <div className="rounded-3xl bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Next Up</p>
                    {nextSlot ? (
                      <div className="mt-3">
                        <p className="text-xl font-black text-slate-950">{nextSlot.subject || 'Upcoming class'}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {nextSlot.class || nextSlot.classId?.name || 'Assigned class'} - Period {nextSlot.period}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No more classes scheduled for today.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {todaySlots.length ? (
                <div className="mt-5 space-y-3">
                  {todaySlots.map((slot) => {
                    const isCurrent = Number(slot.period) === activePeriod;
                    const classLabel = slot.class || slot.classId?.name || 'Assigned class';
                    const classId = slot.classId?._id || slot.classId;

                    return (
                      <div
                        key={`${slot.day}-${slot.period}-${slot.subject}`}
                        className={`flex flex-col gap-3 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between ${
                          isCurrent ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-900 shadow-sm">
                            P{slot.period}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-950">{slot.subject || 'Subject'}</p>
                            <p className="text-xs text-slate-500">{classLabel}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isCurrent ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                              Live now
                            </span>
                          ) : null}
                          {classId ? (
                            <>
                              <Link to={`/teacher/attendance?class=${classId}`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                                Attendance
                              </Link>
                              <Link to={`/teacher/marks?class=${classId}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                                Marks
                              </Link>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <DashboardEmptyState
                  icon={CalendarDays}
                  title="No classes scheduled today"
                  subtitle="Your timetable is clear for today. You can use the time for planning, grading, or student follow-up."
                />
              )}

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Free Periods</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {freePeriods.length ? (
                    freePeriods.map((period) => (
                      <span key={period} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        P{period}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No free periods today.</span>
                  )}
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={GraduationCap}
                title="My Classes"
                subtitle="Fast class access with student counts"
                tone="indigo"
                action={<Link to="/teacher/classes" className="text-xs font-bold text-indigo-700 hover:text-indigo-900">View all</Link>}
              />

              {classes.length ? (
                <div className="space-y-3">
                  {classes.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.students?.length || 0} students enrolled</p>
                      </div>
                      <Link to={`/teacher/classes/${item._id}`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900">
                        Open <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Users} title="No assigned classes" subtitle="Your class assignments will appear here once linked by admin." />
              )}
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={CloudSun} title="Teaching Weather Guidance" subtitle="Role-specific weather advice for classes and activities" tone="sky" />
              {weatherAdvice.length || weatherAlerts.length ? (
                <div className="space-y-3">
                  {weatherAdvice.slice(0, 3).map((item, index) => (
                    <div key={`${item.text}-${index}`} className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-800">{item.text}</p>
                    </div>
                  ))}
                  {weatherAlerts.slice(0, 2).map((item) => (
                    <div key={item._id} className="rounded-3xl border border-amber-100 bg-amber-50/80 p-4">
                      <p className="text-sm font-black text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={CloudSun} title="No weather guidance yet" subtitle="Teacher weather tips will appear after the next successful weather sync." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={Bell}
                title="Announcements"
                subtitle="Latest notices for teachers"
                tone="amber"
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
                <DashboardEmptyState icon={Bell} title="No announcements" subtitle="New school notices for teachers will land here." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Sparkles} title="Teaching Momentum" subtitle="Attendance health and planning progress" tone="emerald" />
              <div className="space-y-4">
                <DashboardMiniMetric icon={Clock3} label="Present Records" value={attendanceStats?.present || 0} tone="emerald" />
                <DashboardMiniMetric icon={AlarmClock} label="Late Records" value={attendanceStats?.late || 0} tone="amber" />
                <DashboardMiniMetric icon={LayoutGrid} label="Recent Lesson Plans" value={recentLessonPlans.length} tone="violet" />
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Attendance consistency</span>
                    <span>{attendanceRate}%</span>
                  </div>
                  <DashboardProgressBar value={attendanceRate} tone="emerald" />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={FileText} title="Upcoming Academic Work" subtitle="Near-term exams and recent plans" tone="violet" />
              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Upcoming Exams</p>
                  {upcomingExams.length ? (
                    <div className="space-y-3">
                      {upcomingExams.slice(0, 3).map((exam) => (
                        <div key={exam._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-sm font-black text-slate-950">{exam.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{exam.classId?.name || 'Assigned class'} - {formatDate(exam.date)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No exams scheduled in the next 7 days.</p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Recent Lesson Plans</p>
                  {recentLessonPlans.length ? (
                    <div className="space-y-3">
                      {recentLessonPlans.slice(0, 3).map((plan) => (
                        <div key={plan._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-sm font-black text-slate-950">{plan.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {plan.subject?.name || 'Subject not set'} - Week {plan.weekNumber || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No lesson plans recorded yet.</p>
                  )}
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
