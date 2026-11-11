import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import AttendanceChart from '../../components/attendance/AttendanceChart';
import AbsenceAlertCard from '../../components/attendance/AbsenceAlertCard';
import {
  FiUsers,
  FiUserCheck,
  FiBarChart2,
  FiBell,
  FiDownload,
} from 'react-icons/fi';
import { getStudentAttendanceStats, getAttendance } from '../../services/attendanceApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ParentAttendanceView = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('attendance'); // 'attendance' | 'alerts'

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildAttendance();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const { data } = await api.get('/parents/children');
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAttendance = async () => {
    setLoading(true);
    try {
      const studentId = selectedChild._id || selectedChild.studentId?._id;
      const [statsRes, recordsRes] = await Promise.all([
        getStudentAttendanceStats(studentId),
        getAttendance({ studentId, limit: 60 }),
      ]);
      setStats(statsRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats
    ? [
        { label: 'Present', value: stats.present, color: '#22c55e' },
        { label: 'Absent', value: stats.absent, color: '#ef4444' },
        { label: 'Late', value: stats.late, color: '#eab308' },
        { label: 'Leave', value: stats.leave, color: '#3b82f6' },
      ]
    : [];

  return (
    <Layout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Children's Attendance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor attendance and get alerts
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <FiDownload className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <button
                key={child._id}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selectedChild?._id === child._id
                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {child.userId?.name || child.name || 'Child'}
              </button>
            ))}
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewType('attendance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewType === 'attendance'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <FiBarChart2 className="w-4 h-4 inline mr-1" />
            Attendance
          </button>
          <button
            onClick={() => setViewType('alerts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewType === 'alerts'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <FiBell className="w-4 h-4 inline mr-1" />
            Alerts
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : !selectedChild ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No children linked to your account</p>
          </div>
        ) : viewType === 'attendance' ? (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AttendanceStatsCard
                  title="Attendance %"
                  value={`${stats.percentage}%`}
                  icon={FiBarChart2}
                  color={
                    stats.percentage >= 75
                      ? 'green'
                      : stats.percentage >= 60
                      ? 'yellow'
                      : 'red'
                  }
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
                  color="red"
                />
                <AttendanceStatsCard
                  title="Late / Leave"
                  value={(stats.late || 0) + (stats.leave || 0)}
                  color="yellow"
                />
              </div>
            )}

            {/* Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Attendance Breakdown
                </h3>
                <AttendanceChart data={chartData} height={250} type="donut" />
              </div>
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Recent Records
                </h3>
                <AttendanceTable
                  records={records.slice(0, 15)}
                  showStudent={false}
                  showDate={true}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Absence Alerts
            </h3>
            {records
              .filter((r) => r.status !== 'present')
              .slice(0, 10).length > 0 ? (
              <div className="space-y-3">
                {records
                  .filter((r) => r.status !== 'present')
                  .slice(0, 10)
                  .map((record) => (
                    <AbsenceAlertCard
                      key={record._id}
                      alert={{
                        studentName:
                          record.studentId?.userId?.name || 'Your Child',
                        className: record.classId?.name || 'Class',
                        date: record.date,
                        status: record.status,
                        sentTo: 'Your email',
                        sentVia: ['email', 'notification'],
                      }}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No absence alerts. All attendance is good!
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentAttendanceView;
