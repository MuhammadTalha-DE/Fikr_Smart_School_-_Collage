
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getStudentWeatherSummary } from '../../services/weatherService';
import { getStudentHostelStatus } from '../../services/hostelPortalService';
import {
  FiCalendar,
  FiBook,
  FiBarChart2,
  FiDollarSign,
  FiBell,
  FiAward,
  FiUsers,
  FiClock,
  FiChevronRight,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSun,
  FiCloud,
  FiCloudRain,
  FiThermometer,
  FiFile,
  FiSend,
  FiMessageSquare,
  FiTarget,
  FiActivity,
  FiMapPin,
  FiHome,
  FiTruck,
  FiEye,
  FiRefreshCw,
  FiInfo,
  FiPlay,
  FiUserCheck,
  FiAlertCircle,
  FiBookOpen,
  FiLayers,
  FiShield,
  FiExternalLink,
  FiClipboard,
} from 'react-icons/fi';

// ─── Utility helpers ───────────────────────────────────────────────────────
const getDayName = (date = new Date()) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getTodayDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

const getInitials = (name = 'Student') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST';
};

const clampPercent = (value) => {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, number));
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `PKR ${amount.toLocaleString()}`;
};

const getCurrentPeriod = (slots) => {
  const today = getDayName();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMin;

  // Approximate period start times: period 1 starts at 8:00, each 45 min + gap.
  const todaySlots = slots?.filter((s) => s.day === today) || [];
  if (todaySlots.length === 0) return null;

  for (let i = 0; i < todaySlots.length; i += 1) {
    const periodStart = 8 * 60 + i * 50;
    const periodEnd = periodStart + 45;
    if (currentTimeMinutes >= periodStart && currentTimeMinutes < periodEnd) {
      return { ...todaySlots[i], periodNumber: i + 1 };
    }
  }
  return null;
};

const getNextPeriod = (slots) => {
  const today = getDayName();
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const todaySlots = slots?.filter((s) => s.day === today) || [];

  for (let i = 0; i < todaySlots.length; i += 1) {
    const periodStart = 8 * 60 + i * 50;
    if (periodStart > currentTimeMinutes) {
      return { ...todaySlots[i], periodNumber: i + 1, startTime: periodStart };
    }
  }
  return null;
};

// Static Tailwind maps are used because Tailwind does not reliably compile dynamic class names.
const colorStyles = {
  blue: {
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    ring: 'ring-blue-200',
    progress: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  indigo: {
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    icon: 'bg-indigo-100 text-indigo-700',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    ring: 'ring-indigo-200',
    progress: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-violet-500',
  },
  purple: {
    soft: 'bg-purple-50 text-purple-700 border-purple-100',
    icon: 'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    ring: 'ring-purple-200',
    progress: 'bg-purple-500',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  amber: {
    soft: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
    ring: 'ring-amber-200',
    progress: 'bg-amber-500',
    gradient: 'from-amber-400 to-orange-500',
  },
  green: {
    soft: 'bg-green-50 text-green-700 border-green-100',
    icon: 'bg-green-100 text-green-700',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    ring: 'ring-green-200',
    progress: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-500',
  },
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ring: 'ring-emerald-200',
    progress: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    icon: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
    ring: 'ring-rose-200',
    progress: 'bg-rose-500',
    gradient: 'from-rose-500 to-red-500',
  },
  red: {
    soft: 'bg-red-50 text-red-700 border-red-100',
    icon: 'bg-red-100 text-red-700',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    ring: 'ring-red-200',
    progress: 'bg-red-500',
    gradient: 'from-red-500 to-orange-500',
  },
  sky: {
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
    icon: 'bg-sky-100 text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700 text-white',
    ring: 'ring-sky-200',
    progress: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-500',
  },
  slate: {
    soft: 'bg-slate-50 text-slate-700 border-slate-100',
    icon: 'bg-slate-100 text-slate-700',
    button: 'bg-slate-800 hover:bg-slate-900 text-white',
    ring: 'ring-slate-200',
    progress: 'bg-slate-500',
    gradient: 'from-slate-500 to-slate-700',
  },
};

const getAttendanceColor = (percentage) => {
  if (percentage >= 75) return '#22c55e';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

const getWeatherIcon = (condition) => {
  switch (condition?.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <FiSun className="text-amber-400" />;
    case 'cloudy':
    case 'overcast':
      return <FiCloud className="text-slate-400" />;
    case 'rainy':
    case 'rain':
    case 'drizzle':
    case 'storm':
      return <FiCloudRain className="text-blue-400" />;
    case 'hot':
      return <FiThermometer className="text-red-400" />;
    case 'fog':
    case 'foggy':
    case 'haze':
      return <FiEye className="text-slate-400" />;
    default:
      return <FiSun className="text-amber-300" />;
  }
};

// ─── Reusable UI components ────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action, iconClass = 'text-blue-600' }) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className={iconClass} size={20} />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-950 md:text-lg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const QuickAction = ({ icon: Icon, label, to, color = 'blue' }) => {
  const style = colorStyles[color] || colorStyles.blue;
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.soft}`}
    >
      <Icon size={15} />
      <span>{label}</span>
      <FiChevronRight className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" size={13} />
    </Link>
  );
};

const StatCard = ({ icon: Icon, label, value, sublabel, color = 'blue', onClick }) => {
  const style = colorStyles[color] || colorStyles.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon} ring-4 ${style.ring}`}>
          <Icon size={21} />
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 transition group-hover:bg-slate-100">
          View
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <p className="truncate text-2xl font-black tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-600">{label}</p>
        {sublabel && <p className="mt-0.5 truncate text-xs text-slate-400">{sublabel}</p>}
      </div>
    </button>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
      <Icon size={24} />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {subtitle && <p className="mt-1 max-w-xs text-xs text-slate-400">{subtitle}</p>}
  </div>
);

const ProgressBar = ({ value, barClass = 'bg-blue-500', height = 'h-2.5' }) => (
  <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
    <div className={`h-full rounded-full ${barClass} transition-all duration-700`} style={{ width: `${clampPercent(value)}%` }} />
  </div>
);

const MiniMetric = ({ label, value, icon: Icon, color = 'blue' }) => {
  const style = colorStyles[color] || colorStyles.blue;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <p className="truncate text-sm font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const InfoPill = ({ children, color = 'slate' }) => {
  const style = colorStyles[color] || colorStyles.slate;
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style.soft}`}>{children}</span>;
};

// ─── Main Dashboard Component ──────────────────────────────────────────────
const SmartStudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState(null);
  const [feeAccount, setFeeAccount] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [transport, setTransport] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);

  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [nextPeriod, setNextPeriod] = useState(null);

  useEffect(() => {
    fetchAllDashboardData();
    // Refresh every 60 seconds for real-time feel
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timetable?.slots) {
      setCurrentPeriod(getCurrentPeriod(timetable.slots));
      setNextPeriod(getNextPeriod(timetable.slots));
    }
  }, [timetable, refreshKey]);

  useEffect(() => {
    const loadStudentWeather = async () => {
      try {
        const response = await getStudentWeatherSummary();
        const weatherData = response.data?.data;
        const current = weatherData?.current;
        const primaryAdvice = weatherData?.advice?.[0]?.text;
        const primaryAlert = weatherData?.alerts?.[0]?.message;

        if (!current) return;

        setWeatherAlert({
          condition: current.condition,
          temperature: Math.round(current.temperature),
          alert: primaryAlert || primaryAdvice || 'Weather is normal for campus activities.',
        });
      } catch (error) {
        setWeatherAlert({
          condition: 'Clear',
          temperature: '--',
          alert: 'Weather data will appear after the next successful sync.',
        });
      }
    };

    loadStudentWeather();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Student profile
      const { data: studentData } = await api.get('/students/me');
      setStudent(studentData);

      const studentId = studentData._id;
      const classId = studentData.classId?._id || studentData.classId;

      // 2. Attendance summary
      try {
        const { data: attData } = await api.get(`/students/${studentId}/attendance`);
        setAttendance(attData);
      } catch (e) {
        /* silent */
      }

      // 3. Marks
      try {
        const { data: marksData } = await api.get(`/students/${studentId}/marks`);
        setMarks(marksData);
      } catch (e) {
        /* silent */
      }

      // 4. Fee account
      try {
        const { data: feeData } = await api.get('/fee-accounts/my');
        if (feeData?.account) setFeeAccount(feeData.account);
      } catch (e) {
        /* silent */
      }

      // 5. Announcements
      try {
        const { data: annData } = await api.get('/announcements');
        setAnnouncements((annData || []).filter((a) => a.targetRole === 'all' || a.targetRole === 'student').slice(0, 5));
      } catch (e) {
        /* silent */
      }

      // 6. Timetable
      if (classId) {
        try {
          const { data: ttData } = await api.get(`/timetables/${classId}`, {
            params: { status: 'published', date: new Date().toISOString() },
          });
          setTimetable(ttData);
        } catch (e) {
          /* silent */
        }
      }

      // 7. Assignments for class
      if (classId) {
        try {
          const { data: asgData } = await api.get('/assignments', { params: { classId } });
          setAssignments(Array.isArray(asgData) ? asgData : []);
        } catch (e) {
          /* silent */
        }
      }

      // 8. My submissions
      try {
        const { data: subData } = await api.get('/assignments/my-submissions');
        setMySubmissions(Array.isArray(subData) ? subData : []);
      } catch (e) {
        /* silent */
      }

      // 9. Upcoming exams for my class
      if (classId) {
        try {
          const { data: examData } = await api.get('/exams/student/mine');
          setExams(Array.isArray(examData) ? examData : []);
        } catch (e) {
          /* silent */
        }
      }

      // 10. Transport allocation
      try {
        const { data: transportData } = await api.get('/transport/my-allocation');
        setTransport(transportData);
      } catch (e) {
        /* silent */
      }

      // 12. Hostel status
      try {
        const { data: hostelData } = await getStudentHostelStatus();
        setHostel(hostelData);
      } catch (e) {
        /* silent */
      }
    } catch (err) {
      console.error('Dashboard fetch error', err);
      toast.error('Some dashboard widgets could not load');
    } finally {
      setLoading(false);
    }
  };

  // ─── Computed values ─────────────────────────────────────────────────────
  const attendancePct = clampPercent(attendance?.percentage || 0);
  const className = student?.classId?.name || 'Not assigned';
  const overallGrade = marks?.overallGrade || '—';
  const feeDue = feeAccount?.dueAmount || 0;
  const feeTotal = feeAccount?.totalAmount || 0;
  const feeStatus = feeAccount?.status || 'unpaid';

  const pendingAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      const sub = mySubmissions.find((s) => {
        const assignmentId = s.assignmentId?._id || s.assignmentId;
        return assignmentId === asg._id;
      });
      return !sub;
    });
  }, [assignments, mySubmissions]);

  const nextExam = useMemo(() => {
    if (!exams || exams.length === 0) return null;
    const now = new Date();
    const upcoming = exams
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming[0] || null;
  }, [exams]);

  const examCountdown = useMemo(() => {
    if (!nextExam) return null;
    const diff = new Date(nextExam.date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [nextExam]);

  const todaySlots = useMemo(() => {
    const today = getDayName();
    return timetable?.slots?.filter((s) => s.day === today).sort((a, b) => a.period - b.period) || [];
  }, [timetable]);

  const feeStatusInfo = useMemo(() => {
    if (feeDue <= 0 && feeTotal > 0) return { label: 'Paid', color: 'green', icon: FiCheckCircle, helper: 'All dues are clear' };
    if (feeStatus === 'partial') return { label: 'Partial', color: 'amber', icon: FiAlertCircle, helper: `${formatCurrency(feeDue)} due` };
    if (feeDue > 0) return { label: 'Outstanding', color: 'rose', icon: FiXCircle, helper: `${formatCurrency(feeDue)} remaining` };
    return { label: 'Not Assigned', color: 'slate', icon: FiInfo, helper: 'No fee account found' };
  }, [feeDue, feeTotal, feeStatus]);

  const FeeIcon = feeStatusInfo.icon;
  const attendanceMessage = attendancePct >= 75 ? 'Safe attendance range' : attendancePct >= 50 ? 'Needs improvement' : 'Critical attendance risk';
  const attendanceProgressColor = attendancePct >= 75 ? 'bg-green-500' : attendancePct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  if (loading) {
    return (
      <Layout role="student">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6">
          <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
            <div className="h-56 rounded-[2rem] bg-slate-200/80" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 rounded-3xl bg-white shadow-sm" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="h-80 rounded-3xl bg-white shadow-sm" />
                <div className="h-72 rounded-3xl bg-white shadow-sm" />
              </div>
              <div className="space-y-6">
                <div className="h-64 rounded-3xl bg-white shadow-sm" />
                <div className="h-56 rounded-3xl bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/80">
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-blue-950/20 md:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.22),transparent_32%)]" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  Student Command Center
                </div>
                <p className="text-sm font-medium text-blue-100">{getTimeOfDay()}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                  {user?.name?.split(' ')[0] || 'Student'}! 👋
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  {getTodayDate()} · Track your classes, assignments, attendance, fees, AI insights, hostel and transport from one modern portal.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    {className}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    Roll No: {student?.rollNumber || '—'}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    Attendance: {attendancePct}%
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/student/attendance" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">
                    View Attendance
                  </Link>
                  <button
                    type="button"
                    onClick={fetchAllDashboardData}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    <FiRefreshCw /> Refresh
                  </button>
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-lg font-black shadow-lg">
                    {getInitials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{user?.name || 'Student'}</p>
                    <p className="truncate text-xs text-slate-300">Smart learning profile</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-xs text-slate-300">Attendance</p>
                    <p className="mt-1 text-2xl font-black">{attendancePct}%</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-xs text-slate-300">Grade</p>
                    <p className="mt-1 text-2xl font-black">{overallGrade}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-xs text-slate-300">Fee</p>
                    <p className="mt-1 text-lg font-black">{feeStatusInfo.label}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-300">Campus Weather</p>
                      <p className="mt-1 text-sm font-bold text-white">{weatherAlert?.condition || 'Clear'} · {weatherAlert?.temperature || '--'}°C</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl">
                      {getWeatherIcon(weatherAlert?.condition)}
                    </div>
                  </div>
                  {weatherAlert?.alert && <p className="mt-3 text-xs font-semibold text-amber-100">{weatherAlert.alert}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Quick stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FiCalendar}
              label="Attendance"
              value={`${attendancePct}%`}
              sublabel={attendance ? `${attendance.present}/${attendance.total} days · ${attendanceMessage}` : 'No attendance data'}
              color={attendancePct >= 75 ? 'green' : attendancePct >= 50 ? 'amber' : 'rose'}
              onClick={() => navigate('/student/attendance')}
            />
            <StatCard
              icon={FiBook}
              label="Class"
              value={className}
              sublabel={`${student?.classId?.subjects?.length || 0} subjects assigned`}
              color="indigo"
              onClick={() => navigate('/student/timetable')}
            />
            <StatCard
              icon={FiAward}
              label="Overall Grade"
              value={overallGrade}
              sublabel={marks?.subjectAverages?.length ? `${marks.subjectAverages.length} subjects evaluated` : 'No grade summary yet'}
              color="amber"
              onClick={() => navigate('/student/marks')}
            />
            <StatCard
              icon={FiDollarSign}
              label="Fee Status"
              value={feeDue > 0 ? formatCurrency(feeDue) : feeStatusInfo.label}
              sublabel={feeDue > 0 ? `Total: ${formatCurrency(feeTotal)}` : feeStatusInfo.helper}
              color={feeStatusInfo.color}
              onClick={() => navigate('/student/fees')}
            />
          </section>

          {/* Smart overview row */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card className="p-4 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <FiPlay size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current Academic Status</p>
                  {currentPeriod ? (
                    <>
                      <p className="mt-1 truncate text-lg font-black text-slate-950">Ongoing: {currentPeriod.subject}</p>
                      <p className="mt-0.5 text-sm text-slate-500">Period {currentPeriod.periodNumber} · Room {currentPeriod.roomId?.name || '—'}</p>
                    </>
                  ) : nextPeriod ? (
                    <>
                      <p className="mt-1 truncate text-lg font-black text-slate-950">Next: {nextPeriod.subject}</p>
                      <p className="mt-0.5 text-sm text-slate-500">Period {nextPeriod.periodNumber} starts soon</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-black text-slate-950">No active class right now</p>
                      <p className="mt-0.5 text-sm text-slate-500">Use this time for assignments or revision.</p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <FiTarget size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Next Exam</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{nextExam ? `${Math.max(examCountdown, 0)} days` : 'No exam'}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{nextExam?.name || 'No upcoming exam found'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <FiFile size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assignments</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{pendingAssignments.length} pending</p>
                  <p className="mt-0.5 text-sm text-slate-500">{assignments.length} total assigned</p>
                </div>
              </div>
            </Card>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Today's timetable */}
              <Card className="p-5 md:p-6">
                <SectionHeader
                  icon={FiClock}
                  title="Today's Classes"
                  subtitle={`${getDayName()} schedule with teacher and room information`}
                  iconClass="text-blue-600"
                  action={
                    <Link to="/student/timetable" className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                      Full Timetable <FiChevronRight size={14} />
                    </Link>
                  }
                />

                {currentPeriod && (
                  <div className="mb-4 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                        <FiPlay size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-green-900">Ongoing: {currentPeriod.subject}</p>
                        <p className="text-xs text-green-700">Period {currentPeriod.periodNumber} · Room {currentPeriod.roomId?.name || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {todaySlots.length > 0 ? (
                  <div className="space-y-3">
                    {todaySlots.map((slot, idx) => {
                      const isCurrent = currentPeriod?.period === slot.period;
                      return (
                        <div
                          key={`${slot.day}-${slot.period}-${idx}`}
                          className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            isCurrent ? 'border-blue-300 bg-blue-50 shadow-blue-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              <span className="text-[10px] font-bold uppercase">Period</span>
                              <span className="text-xl font-black leading-none">{slot.period}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-black text-slate-950">{slot.subject}</p>
                                {isCurrent && <InfoPill color="blue">Live now</InfoPill>}
                              </div>
                              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                                <FiUsers size={12} /> {slot.teacherId?.userId?.name || 'Teacher'}
                              </p>
                            </div>
                            <div className="hidden text-right sm:block">
                              <p className="text-xs font-semibold text-slate-400">Room</p>
                              <p className="text-sm font-bold text-slate-700">{slot.roomId?.name || '—'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {nextPeriod && !currentPeriod && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        <strong>Next:</strong> {nextPeriod.subject} at Period {nextPeriod.periodNumber}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={FiCalendar} title="No classes scheduled today" subtitle="Enjoy your free time or revise pending lessons." />
                )}
              </Card>

              {/* Pending assignments */}
              <Card className="p-5 md:p-6">
                <SectionHeader
                  icon={FiFile}
                  title="Pending Assignments"
                  subtitle="Track submissions and upcoming deadlines"
                  iconClass="text-amber-600"
                  action={
                    <Link to="/student/assignments" className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100">
                      View All <FiChevronRight size={14} />
                    </Link>
                  }
                />

                {pendingAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingAssignments.slice(0, 4).map((asg) => {
                      const dueDate = new Date(asg.dueDate);
                      const isOverdue = dueDate < new Date();
                      const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={asg._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-amber-200 hover:bg-amber-50/30">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            <FiFile size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">{asg.title}</p>
                            <p className={`mt-0.5 text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                              {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days left`}
                            </p>
                          </div>
                          <Link
                            to={`/student/assignments/${asg._id}/submit`}
                            className="inline-flex items-center gap-1 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            <FiSend size={13} /> Submit
                          </Link>
                        </div>
                      );
                    })}
                    {pendingAssignments.length > 4 && (
                      <p className="text-center text-xs font-semibold text-slate-400">+{pendingAssignments.length - 4} more pending</p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={FiCheckCircle} title="No pending assignments" subtitle="Great! You are clear for now." />
                )}
              </Card>

              {/* Attendance + Recent marks */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="p-5 md:p-6">
                  <SectionHeader icon={FiUserCheck} title="Attendance Overview" subtitle={attendanceMessage} iconClass="text-green-600" />
                  {attendance ? (
                    <div>
                      <div className="flex items-center justify-center">
                        <div className="relative h-36 w-36">
                          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke={getAttendanceColor(attendancePct)}
                              strokeWidth="3"
                              strokeDasharray={`${attendancePct} ${100 - attendancePct}`}
                              strokeLinecap="round"
                              pathLength="100"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-950">{attendancePct}%</span>
                            <span className="text-xs font-semibold text-slate-400">attendance</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <MiniMetric icon={FiCheckCircle} label="Present" value={attendance.present || 0} color="green" />
                        <MiniMetric icon={FiXCircle} label="Absent" value={attendance.absent || 0} color="rose" />
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                          <span>Progress</span>
                          <span>{attendance.total || 0} records</span>
                        </div>
                        <ProgressBar value={attendancePct} barClass={attendanceProgressColor} />
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={FiUserCheck} title="No attendance data" subtitle="Attendance record will appear after teacher marks it." />
                  )}
                </Card>

                <Card className="p-5 md:p-6">
                  <SectionHeader
                    icon={FiAward}
                    title="Recent Marks"
                    subtitle="Latest academic performance"
                    iconClass="text-amber-600"
                    action={
                      <Link to="/student/marks" className="text-xs font-bold text-blue-700 hover:underline">
                        View all
                      </Link>
                    }
                  />
                  {marks?.allMarks?.length > 0 ? (
                    <div className="space-y-4">
                      {marks.allMarks.slice(0, 5).map((m, i) => {
                        const pct = m.totalMarks > 0 ? (m.marksObtained / m.totalMarks) * 100 : 0;
                        const barClass = pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={`${m.subject}-${m.examType}-${i}`}>
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{m.subject}</p>
                                <p className="text-xs text-slate-400">{m.examType || 'Exam'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-900">{m.marksObtained}/{m.totalMarks}</p>
                                <p className="text-xs font-semibold text-slate-400">{pct.toFixed(0)}%</p>
                              </div>
                            </div>
                            <ProgressBar value={pct} barClass={barClass} height="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState icon={FiAward} title="No marks recorded yet" subtitle="Your marks will appear after exams or assessments." />
                  )}
                </Card>
              </div>

              {/* Announcements */}
              <Card className="p-5 md:p-6">
                <SectionHeader
                  icon={FiBell}
                  title="Latest Announcements"
                  subtitle="Important school notices for students"
                  iconClass="text-sky-600"
                  action={
                    <Link to="/student/announcements" className="text-xs font-bold text-blue-700 hover:underline">
                      View all
                    </Link>
                  }
                />
                {announcements.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {announcements.slice(0, 4).map((ann) => (
                      <div key={ann._id || ann.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                            <FiBell size={15} />
                          </span>
                          <p className="line-clamp-1 text-sm font-black text-slate-900">{ann.title || 'Announcement'}</p>
                        </div>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500">{ann.message || ann.description || 'No details available.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={FiBell} title="No announcements" subtitle="New announcements will appear here." />
                )}
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Exam countdown */}
              <Card className="p-5 md:p-6">
                <SectionHeader icon={FiTarget} title="Exam Countdown" subtitle="Upcoming exam reminder" iconClass="text-red-600" />
                {nextExam ? (
                  <div>
                    <div className="rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 p-5 text-center text-white shadow-lg shadow-red-100">
                      <p className="text-6xl font-black leading-none">{Math.max(examCountdown, 0)}</p>
                      <p className="mt-2 text-sm font-bold text-red-50">days to go</p>
                    </div>
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                      <p className="text-sm font-black text-slate-900">{nextExam.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        📅 {new Date(nextExam.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">🕐 {nextExam.session || 'Morning'}</p>
                      {nextExam.subjects?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {nextExam.subjects.map((s, i) => (
                            <span key={`${s}-${i}`} className="rounded-full border border-red-100 bg-white px-2 py-1 text-[11px] font-bold text-red-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={FiTarget} title="No upcoming exam" subtitle="Your exam countdown will appear here." />
                )}
              </Card>

              {/* Weather */}
              <Card className="p-5 md:p-6">
                <SectionHeader icon={FiSun} title="Weather Alert" subtitle="Campus environment update" iconClass="text-amber-500" />
                <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-100">{weatherAlert?.condition || 'Clear'}</p>
                      <p className="mt-1 text-5xl font-black">{weatherAlert?.temperature || '--'}°</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-md">
                      {getWeatherIcon(weatherAlert?.condition)}
                    </div>
                  </div>
                  <p className="mt-4 rounded-2xl bg-white/15 p-3 text-sm font-semibold text-blue-50">
                    {weatherAlert?.alert || 'Weather is normal for campus activities.'}
                  </p>
                </div>
              </Card>

              {/* Fee, hostel, transport */}
              <Card className="p-5 md:p-6">
                <SectionHeader icon={FiShield} title="Campus Services" subtitle="Fee, hostel and transport status" iconClass="text-indigo-600" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colorStyles[feeStatusInfo.color]?.icon || colorStyles.slate.icon}`}>
                      <FeeIcon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900">Fee: {feeStatusInfo.label}</p>
                      <p className="truncate text-xs text-slate-500">{feeStatusInfo.helper}</p>
                    </div>
                    <Link to="/student/fees" className="text-slate-400 hover:text-blue-600"><FiExternalLink /></Link>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <FiHome size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900">Hostel</p>
                      <p className="truncate text-xs text-slate-500">{hostel?.status || hostel?.room?.name || 'No hostel status found'}</p>
                    </div>
                    <Link to="/student/hostel" className="text-slate-400 hover:text-blue-600"><FiExternalLink /></Link>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <FiTruck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900">Transport</p>
                      <p className="truncate text-xs text-slate-500">{transport?.route?.name || transport?.routeName || 'No transport allocation found'}</p>
                    </div>
                    <Link to="/student/transport" className="text-slate-400 hover:text-blue-600"><FiExternalLink /></Link>
                  </div>
                </div>
              </Card>

              {/* Quick actions */}
              <Card className="p-5 md:p-6">
                <SectionHeader icon={FiLayers} title="Quick Actions" subtitle="Fast access to student tools" iconClass="text-slate-700" />
                <div className="flex flex-wrap gap-2">
                  <QuickAction icon={FiBookOpen} label="Courses" to="/student/courses" color="indigo" />
                  <QuickAction icon={FiMessageSquare} label="Messages" to="/student/messages" color="green" />
                  <QuickAction icon={FiBell} label="Notices" to="/student/announcements" color="sky" />
                  <QuickAction icon={FiClipboard} label="Workflow" to="/student/workflows" color="indigo" />
                  <QuickAction icon={FiCalendar} label="PTM Center" to="/student/ptm-center" color="blue" />
                  <QuickAction icon={FiMapPin} label="Transport" to="/student/transport" color="blue" />
                  <QuickAction icon={FiHome} label="Hostel" to="/student/hostel" color="emerald" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SmartStudentDashboard;
