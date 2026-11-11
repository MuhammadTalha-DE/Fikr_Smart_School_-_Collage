import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import AttendanceChart from '../../components/attendance/AttendanceChart';
import AttendanceRiskCard from '../../components/attendance/AttendanceRiskCard';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiRefreshCw,
  FiDownload,
  FiBarChart2,
} from 'react-icons/fi';
import {
  getTodayStats,
  getLowAttendanceStudents,
  getMonthlyTrends,
  getAttendanceRiskAnalysis,
  getAttendance,
} from '../../services/attendanceApi';
import toast from 'react-hot-toast';

const AdminAttendanceDashboard = () => {
  const [todayStats, setTodayStats] = useState(null);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, lowAttRes, trendsRes, riskRes, recordsRes] =
        await Promise.all([
          getTodayStats(),
          getLowAttendanceStudents({ threshold: 75, limit: 10 }),
          getMonthlyTrends({ year: new Date().getFullYear() }),
          getAttendanceRiskAnalysis(),
          getAttendance({ limit: 20 }),
        ]);

      setTodayStats(statsRes.data);
      setLowAttendance(lowAttRes.data);
      setMonthlyTrends(trendsRes.data);
      setRiskAnalysis(riskRes.data);
      setRecentRecords(recordsRes.data);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'low-attendance', label: 'Low Attendance' },
    { id: 'risk-analysis', label: 'Risk Analysis' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Attendance Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor attendance across all classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              <FiDownload className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Today's Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AttendanceStatsCard
            title="Total Students"
            value={todayStats?.totalStudents || '—'}
            icon={FiUsers}
            color="blue"
          />
          <AttendanceStatsCard
            title="Present Today"
            value={todayStats?.present || 0}
            subtitle={`${todayStats?.percentage || 0}% attendance`}
            icon={FiUserCheck}
            color="green"
            percentage={todayStats?.percentage}
          />
          <AttendanceStatsCard
            title="Absent Today"
            value={todayStats?.absent || 0}
            icon={FiUserX}
            color="red"
          />
          <AttendanceStatsCard
            title="Late Today"
            value={todayStats?.late || 0}
            icon={FiClock}
            color="yellow"
          />
          <AttendanceStatsCard
            title="On Leave"
            value={todayStats?.leave || 0}
            icon={FiTrendingUp}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trends Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Monthly Attendance Trends
              </h3>
              <AttendanceChart
                data={monthlyTrends.map((m) => ({
                  label: m.month,
                  value: m.percentage,
                  color: m.percentage >= 75 ? '#22c55e' : m.percentage >= 60 ? '#eab308' : '#ef4444',
                }))}
                height={250}
                type="bar"
              />
            </div>

            {/* Low Attendance Summary */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-red-500" />
                Low Attendance Alert
              </h3>
              {lowAttendance.length > 0 ? (
                <div className="space-y-3">
                  {lowAttendance.slice(0, 5).map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {student.name}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {student.percentage}%
                      </span>
                    </div>
                  ))}
                  {lowAttendance.length > 5 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{lowAttendance.length - 5} more students
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  All students have good attendance!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'low-attendance' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Students with Low Attendance (&lt;75%)
            </h3>
            {lowAttendance.length > 0 ? (
              <div className="space-y-3">
                {lowAttendance.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                        {student.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Present: {student.present}/{student.total} days
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {student.percentage}%
                      </p>
                      <p className="text-xs text-gray-400">
                        Absent: {student.absent} | Late: {student.late}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                All students have good attendance records
              </p>
            )}
          </div>
        )}

        {activeTab === 'risk-analysis' && (
          <div>
            {riskAnalysis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riskAnalysis.map((student, idx) => (
                  <AttendanceRiskCard key={idx} student={student} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-8 text-center">
                <FiBarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">
                  No risk analysis data available. Start marking attendance to
                  see AI insights.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Recent Attendance Records
            </h3>
            <AttendanceTable
              records={recentRecords}
              showStudent={true}
              showDate={true}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminAttendanceDashboard;
