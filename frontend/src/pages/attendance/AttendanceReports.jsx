import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import AttendanceChart from '../../components/attendance/AttendanceChart';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import {
  FiDownload,
  FiFilter,
  FiCalendar,
  FiBarChart2,
  FiRefreshCw,
  FiFileText,
  FiPrinter,
} from 'react-icons/fi';
import {
  getMonthlyTrends,
  getLowAttendanceStudents,
  getClassAttendanceSummary,
  getAttendance,
} from '../../services/attendanceApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceReports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [classStats, setClassStats] = useState(null);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReportData();
    }
  }, [selectedClass, dateRange, reportType]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
    } catch (error) {
      toast.error('Failed to load classes');
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (reportType === 'summary') {
        const [statsRes, trendsRes] = await Promise.all([
          getClassAttendanceSummary(selectedClass, dateRange),
          getMonthlyTrends({ classId: selectedClass, year: new Date().getFullYear() }),
        ]);
        setClassStats(statsRes.data);
        setMonthlyTrends(trendsRes.data);
      } else if (reportType === 'detailed') {
        const { data } = await getAttendance({
          classId: selectedClass,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setRecords(data);
      } else if (reportType === 'low-attendance') {
        const { data } = await getLowAttendanceStudents({ threshold: 75, limit: 50 });
        setLowAttendance(data);
      }
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csvData = [];
    if (reportType === 'summary' && classStats) {
      csvData = [['Metric', 'Value'], ['Total', classStats.total], ['Present', classStats.present], ['Absent', classStats.absent], ['Late', classStats.late], ['Percentage', `${classStats.percentage}%`]];
    } else if (reportType === 'detailed') {
      csvData = [['Date', 'Student', 'Status', 'Method', 'Remarks']];
      records.forEach((r) => {
        csvData.push([
          new Date(r.date).toLocaleDateString(),
          r.studentId?.userId?.name || 'Unknown',
          r.status,
          r.method || 'manual',
          r.remarks || '',
        ]);
      });
    }

    const csv = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported!');
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Attendance Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate and export attendance reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                From
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                To
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Report Type
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {['summary', 'detailed', 'low-attendance'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      reportType === type
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    {type === 'summary'
                      ? 'Summary'
                      : type === 'detailed'
                      ? 'Detailed'
                      : 'Low Attendance'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={fetchReportData}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600"
            >
              <FiRefreshCw className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : reportType === 'summary' && classStats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AttendanceStatsCard
                title="Total Records"
                value={classStats.total}
                icon={FiBarChart2}
                color="blue"
              />
              <AttendanceStatsCard
                title="Present"
                value={classStats.present}
                icon={FiBarChart2}
                color="green"
                percentage={classStats.percentage}
              />
              <AttendanceStatsCard
                title="Absent"
                value={classStats.absent}
                color="red"
              />
              <AttendanceStatsCard
                title="Late"
                value={classStats.late}
                color="yellow"
              />
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Monthly Trends
              </h3>
              <AttendanceChart
                data={monthlyTrends.map((m) => ({
                  label: m.month,
                  value: m.percentage,
                  color:
                    m.percentage >= 75
                      ? '#22c55e'
                      : m.percentage >= 60
                      ? '#eab308'
                      : '#ef4444',
                }))}
                height={250}
                type="bar"
              />
            </div>
          </div>
        ) : reportType === 'detailed' ? (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Detailed Attendance Records ({records.length})
            </h3>
            <AttendanceTable
              records={records}
              showStudent={true}
              showDate={true}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Low Attendance Students (&lt;75%)
            </h3>
            {lowAttendance.length > 0 ? (
              <div className="space-y-2">
                {lowAttendance.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {student.name}
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {student.percentage}% ({student.present}/{student.total})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No students with low attendance
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceReports;
