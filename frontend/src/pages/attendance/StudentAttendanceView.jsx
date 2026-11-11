import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import AttendanceChart from '../../components/attendance/AttendanceChart';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import QRScanner from '../../components/attendance/QRScanner';
import {
  FiCalendar,
  FiUserCheck,
  FiBarChart2,
  FiCamera,
  FiDownload,
} from 'react-icons/fi';
import { getStudentAttendanceStats, getAttendance } from '../../services/attendanceApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentAttendanceView = () => {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar' | 'chart'
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        getStudentAttendanceStats(''), // Empty = current student
        getAttendance({ limit: 100 }),
      ]);
      setStats(statsRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = stats
    ? [
        { label: 'Present', value: stats.present, color: '#22c55e' },
        { label: 'Absent', value: stats.absent, color: '#ef4444' },
        { label: 'Late', value: stats.late, color: '#eab308' },
        { label: 'Leave', value: stats.leave, color: '#3b82f6' },
      ]
    : [];

  return (
    <Layout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Attendance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your attendance record
            </p>
          </div>
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <FiCamera className="w-4 h-4" />
            Scan QR
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AttendanceStatsCard
              title="Attendance %"
              value={`${stats.percentage}%`}
              icon={FiBarChart2}
              color={stats.percentage >= 75 ? 'green' : stats.percentage >= 60 ? 'yellow' : 'red'}
              percentage={stats.percentage}
            />
            <AttendanceStatsCard
              title="Present"
              value={stats.present}
              subtitle={`out of ${stats.total} days`}
              icon={FiUserCheck}
              color="green"
            />
            <AttendanceStatsCard
              title="Absent"
              value={stats.absent}
              icon={FiCalendar}
              color="red"
            />
            <AttendanceStatsCard
              title="Late / Leave"
              value={(stats.late || 0) + (stats.leave || 0)}
              icon={FiCalendar}
              color="yellow"
            />
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'list', label: 'List', icon: FiBarChart2 },
            { id: 'calendar', label: 'Calendar', icon: FiCalendar },
            { id: 'chart', label: 'Chart', icon: FiBarChart2 },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === v.id
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <v.icon className="w-4 h-4" />
              {v.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Attendance Records
            </h3>
            <AttendanceTable records={records} showStudent={false} showDate={true} />
          </div>
        ) : viewMode === 'calendar' ? (
          <AttendanceCalendar
            records={records}
            year={new Date().getFullYear()}
            month={new Date().getMonth()}
          />
        ) : (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Attendance Breakdown
            </h3>
            <AttendanceChart data={chartData} height={280} type="donut" />
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={(data) => {
              toast.success('Attendance marked via QR!');
              fetchAttendanceData();
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default StudentAttendanceView;
