import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiFilter, FiCalendar, FiBook, FiUser } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [filters, setFilters] = useState({
    classId: '',
    subject: '',
    examType: '',
    startDate: '',
    endDate: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    classes: [],
    subjects: [],
    examTypes: [],
  });
  const [attendanceData, setAttendanceData] = useState({ labels: [], datasets: [] });
  const [marksData, setMarksData] = useState({ labels: [], datasets: [] });
  const [teacherData, setTeacherData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceTrends();
    else if (activeTab === 'marks') fetchMarksDistribution();
    else if (activeTab === 'teacher') fetchTeacherPerformance();
  }, [activeTab, filters]);

  const fetchFilterOptions = async () => {
    try {
      const { data } = await api.get('/analytics/filters');
      setFilterOptions(data);
    } catch (error) {
      console.error('Failed to fetch filters', error);
    }
  };

  const fetchAttendanceTrends = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await api.get('/analytics/attendance-trends', { params });

      const labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      const percentages = data.map(d => d.percentage.toFixed(1));

      setAttendanceData({
        labels,
        datasets: [
          {
            label: 'Attendance %',
            data: percentages,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch attendance trends', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarksDistribution = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.subject) params.subject = filters.subject;
      if (filters.examType) params.examType = filters.examType;
      const { data } = await api.get('/analytics/marks-distribution', { params });

      setMarksData({
        labels: data.labels,
        datasets: [
          {
            label: 'Number of Students',
            data: data.data,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderRadius: 6,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch marks distribution', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherPerformance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.classId) params.classId = filters.classId;
      const { data } = await api.get('/analytics/teacher-performance', { params });

      setTeacherData({
        labels: data.map(t => t.teacherName || 'Unknown'),
        datasets: [
          {
            label: 'Average Marks (%)',
            data: data.map(t => t.average),
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderRadius: 6,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch teacher performance', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ classId: '', subject: '', examType: '', startDate: '', endDate: '' });
  };

  return (
    <Layout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500">Deep insights into attendance, marks, and teacher performance.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiCalendar className="inline mr-2" /> Attendance Trends
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'marks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiBook className="inline mr-2" /> Marks Distribution
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teacher'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiUser className="inline mr-2" /> Teacher Performance
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Class</label>
            <select
              value={filters.classId}
              onChange={e => handleFilterChange('classId', e.target.value)}
              className="input-field"
            >
              <option value="">All Classes</option>
              {filterOptions.classes.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {activeTab === 'marks' && (
            <>
              <div className="w-48">
                <label className="block text-xs text-gray-500 mb-1">Subject</label>
                <select
                  value={filters.subject}
                  onChange={e => handleFilterChange('subject', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Subjects</option>
                  {filterOptions.subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-xs text-gray-500 mb-1">Exam Type</label>
                <select
                  value={filters.examType}
                  onChange={e => handleFilterChange('examType', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Exams</option>
                  {filterOptions.examTypes.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'attendance' && (
            <>
              <div className="w-40">
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}

          {activeTab === 'teacher' && (
            <div className="w-48">
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <select
                value={filters.subject}
                onChange={e => handleFilterChange('subject', e.target.value)}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {filterOptions.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={resetFilters} className="btn-secondary h-10">
            <FiFilter className="mr-1" /> Reset
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-white p-6 rounded-lg shadow">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        ) : (
          <div className="h-80">
            {activeTab === 'attendance' && attendanceData.labels?.length > 0 && (
              <Line
                data={attendanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentage (%)' } },
                  },
                }}
              />
            )}
            {activeTab === 'marks' && marksData.labels?.length > 0 && (
              <Bar
                data={marksData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Number of Students' } },
                    x: { title: { display: true, text: 'Marks Range (%)' } },
                  },
                }}
              />
            )}
            {activeTab === 'teacher' && teacherData.labels?.length > 0 && (
              <Bar
                data={teacherData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Average Marks (%)' } },
                  },
                }}
              />
            )}
            {((activeTab === 'attendance' && !attendanceData.labels?.length) ||
              (activeTab === 'marks' && !marksData.labels?.length) ||
              (activeTab === 'teacher' && !teacherData.labels?.length)) && (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No data available for the selected filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;