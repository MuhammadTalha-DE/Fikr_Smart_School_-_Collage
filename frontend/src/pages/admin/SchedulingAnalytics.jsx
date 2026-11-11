import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBarChart2, FiGrid } from 'react-icons/fi';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SchedulingAnalytics = () => {
  const { periods } = useSchoolPeriods();
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'published',
    academicYear: '',
    term: '',
    scheduleType: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [roomRes, teacherRes] = await Promise.all([
        api.get('/timetables/analytics/rooms', { params }),
        api.get('/timetables/analytics/teacher-workload', { params }),
      ]);
      setRooms(roomRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (error) {
      toast.error(error.userMessage || 'Failed to load scheduling analytics');
    } finally {
      setLoading(false);
    }
  };

  const heatColor = (value) => {
    if (!value) return 'bg-slate-100 text-slate-400';
    if (value === 1) return 'bg-emerald-100 text-emerald-800';
    if (value === 2) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scheduling Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Room utilization and teacher workload heatmap.</p>
        </div>

        <div className="bg-white border rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field">
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <input value={filters.academicYear} onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })} className="input-field" placeholder="Academic year" />
            <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })} className="input-field">
              <option value="">Any term</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Final Term</option>
            </select>
            <select value={filters.scheduleType} onChange={(e) => setFilters({ ...filters, scheduleType: e.target.value })} className="input-field">
              <option value="">Any schedule</option>
              <option value="regular">Regular</option>
              <option value="ramadan">Ramadan</option>
              <option value="exam">Exam</option>
              <option value="half-day">Half-day</option>
              <option value="custom">Custom</option>
            </select>
            <button onClick={fetchAnalytics} className="btn-primary">Refresh</button>
          </div>
        </div>

        {loading && <p className="text-slate-500">Loading analytics...</p>}

        <div className="bg-white border rounded p-4">
          <div className="flex items-center gap-2 mb-4">
            <FiBarChart2 />
            <h2 className="font-semibold text-slate-900">Room Utilization</h2>
          </div>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.roomId} className="border rounded p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{room.roomName}</p>
                    <p className="text-xs text-slate-500">{room.roomType} - capacity {room.capacity}</p>
                  </div>
                  <span className="text-sm font-semibold">{room.utilizationPercent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(room.utilizationPercent, 100)}%` }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mt-3 text-xs">
                  {days.map((day) => (
                    <div key={day} className="bg-slate-50 rounded p-2">
                      <span className="font-medium">{day.slice(0, 3)}</span>: {room.byDay?.[day] || 0}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!rooms.length && !loading && <p className="text-sm text-slate-500">No room usage found.</p>}
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          <div className="flex items-center gap-2 mb-4">
            <FiGrid />
            <h2 className="font-semibold text-slate-900">Teacher Workload Heatmap</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Teacher</th>
                  <th className="py-2 pr-4">Total</th>
                  {days.map((day) => (
                    <th key={day} className="py-2 pr-4">{day.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.teacherId} className="border-b align-top">
                    <td className="py-3 pr-4 font-medium text-slate-900">{teacher.teacherName}</td>
                    <td className="py-3 pr-4">{teacher.totalPeriods}</td>
                    {days.map((day) => (
                      <td key={day} className="py-3 pr-4">
                        <div className="grid grid-cols-4 gap-1 min-w-28">
                          {periods.map((period) => {
                            const value = teacher.heatmap?.[day]?.[period] || 0;
                            return (
                              <span key={period} className={`text-center rounded px-1 py-0.5 ${heatColor(value)}`} title={`${day} P${period}`}>
                                {value ? `P${period}` : '-'}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!teachers.length && !loading && <p className="text-sm text-slate-500 mt-3">No teacher workload found.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SchedulingAnalytics;
