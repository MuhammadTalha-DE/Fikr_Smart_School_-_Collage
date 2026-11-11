import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiChevronLeft, FiChevronRight, FiPrinter, FiBook, FiClock, FiUser
} from 'react-icons/fi';
import Select from 'react-select';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

// Helper: get the Monday of the week for a given date
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();                // 0=Sun, 1=Mon…
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Simple colour map – you can expand this
const subjectColors = {
  'Mathematics': '#e3f2fd',
  'math': '#e3f2fd',
  'English': '#fce4ec',
  'english': '#fce4ec',
  'Science': '#e8f5e9',
  'science': '#e8f5e9',
  'Urdu': '#fff3e0',
  'urdu': '#fff3e0',
  'Islamiat': '#f3e5f5',
  'islamiat': '#f3e5f5',
  'Computer': '#e0f7fa',
  'computer': '#e0f7fa',
  'History': '#efebe9',
  'history': '#efebe9',
  'Geography': '#e8eaf6',
  'geography': '#e8eaf6',
};

const getColorForSubject = (subject) => {
  const key = subject?.toLowerCase() || '';
  if (subjectColors[key]) return subjectColors[key];
  // generate a consistent pastel colour from the string
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 60%, 92%)`;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableFullView = () => {
  const [role, setRole] = useState('');            // admin / teacher / student / parent
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [timetable, setTimetable] = useState(null); // for class timetable
  const [schedule, setSchedule] = useState([]);      // for teacher schedule
  const [loading, setLoading] = useState(false);
  const { periods } = useSchoolPeriods();

  // Week navigation
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));

  useEffect(() => {
    // Determine role from user token (same as useAuth)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(user.role || 'admin');

    if (user.role === 'admin') {
      fetchClasses();
    } else if (user.role === 'teacher') {
      fetchTeacherSchedule();
    } else if (user.role === 'student' || user.role === 'parent') {
      fetchStudentClassAndTimetable();
    }
  }, []);

  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherSchedule();
    } else if (role === 'student' || role === 'parent') {
      fetchStudentClassAndTimetable();
    }
  }, [currentMonday]); // re‑fetch when week changes (optional – schedule is weekly, date range can filter later)

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const fetchTeacherSchedule = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teachers/schedule', {
        params: { date: currentMonday.toISOString() },
      });
      setSchedule(data || []);
    } catch (error) {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentClassAndTimetable = async () => {
    setLoading(true);
    try {
      const { data: profile } = await api.get('/users/profile');
      const classId = profile.student?.classId?._id;
      if (!classId) {
        toast.error('No class assigned');
        return;
      }
      const { data } = await api.get(`/timetables/${classId}`, {
        params: { status: 'published', date: currentMonday.toISOString() },
      });
      setTimetable(data || { slots: [] });
    } catch (error) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = async (option) => {
    setSelectedClass(option?.value || '');
    if (!option?.value) {
      setTimetable(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/timetables/${option.value}`, {
        params: { status: 'published', date: currentMonday.toISOString() },
      });
      setTimetable(data || { slots: [] });
    } catch (error) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handlePrint = () => window.print();

  const weekEnd = new Date(currentMonday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  // Render timetable grid
  const renderGrid = (slots) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium text-gray-700 dark:text-gray-200">
              Day / Period
            </th>
            {periods.map(p => (
              <th
                key={p}
                className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[100px]"
              >
                Period {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className="border border-gray-300 dark:border-gray-600 p-2 font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50">
                {day}
              </td>
              {periods.map(period => {
                const slot = slots?.find(s => s.day === day && s.period === period);
                return (
                  <td
                    key={period}
                    className="border border-gray-300 dark:border-gray-600 p-2 text-center align-middle"
                    style={{
                      backgroundColor: slot ? getColorForSubject(slot.subject) : 'transparent',
                    }}
                  >
                    {slot ? (
                      <div className="flex flex-col items-center text-sm">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{slot.subject}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{slot.teacherId?.userId?.name || '—'}</span>
                        {slot.roomId?.name && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">{slot.roomId.name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render teacher schedule (list style)
  const renderTeacherSchedule = () => {
    if (!schedule.length) return <p className="text-gray-500 text-center py-8">No schedule found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Day</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {schedule.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">{s.day}</td>
                <td className="px-4 py-3">{s.period}</td>
                <td className="px-4 py-3 font-medium">{s.subject}</td>
                <td className="px-4 py-3">{s.class}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout role={role}>
      {/* Glass‑morphic container */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Gradient top bar */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2" />

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiClock className="text-indigo-500" /> Timetable
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentMonday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} –{' '}
                {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Admin class selector */}
              {role === 'admin' && (
                <div className="w-56">
                  <Select
                    options={classOptions}
                    onChange={handleClassChange}
                    placeholder="Select class…"
                    isClearable
                    className="basic-select"
                    classNamePrefix="select"
                  />
                </div>
              )}

              {/* Week navigation */}
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousWeek} className="btn-secondary p-2 rounded-lg" title="Previous Week">
                  <FiChevronLeft />
                </button>
                <button onClick={goToNextWeek} className="btn-secondary p-2 rounded-lg" title="Next Week">
                  <FiChevronRight />
                </button>
              </div>

              {/* Print */}
              <button onClick={handlePrint} className="btn-primary flex items-center gap-1 text-white">
                <FiPrinter /> Print
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading timetable…</div>
          ) : role === 'teacher' ? (
            renderTeacherSchedule()
          ) : timetable ? (
            renderGrid(timetable.slots)
          ) : (
            <div className="text-center py-12 text-gray-500">
              {role === 'admin' ? 'Select a class to view its timetable.' : 'No timetable available.'}
            </div>
          )}
        </div>
      </div>

      {/* Print‑only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .timetable-print-area, .timetable-print-area * { visibility: visible; }
          .timetable-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </Layout>
  );
};

export default TimetableFullView;
