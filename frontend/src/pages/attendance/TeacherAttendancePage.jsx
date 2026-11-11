import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import MarkAttendanceForm from '../../components/attendance/MarkAttendanceForm';
import QRGenerator from '../../components/attendance/QRGenerator';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import { FiUserCheck, FiClock, FiCamera, FiGrid, FiCheckSquare } from 'react-icons/fi';
import api from '../../services/api';
import { getTodayStats, getClassAttendanceSummary } from '../../services/attendanceApi';
import toast from 'react-hot-toast';

const TeacherAttendancePage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState('manual'); // 'manual' | 'qr'
  const [classStats, setClassStats] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && date) {
      fetchClassStats();
    }
  }, [selectedClass, date]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes/my-classes');
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0]._id);
        setSelectedClassName(data[0].name);
      }
    } catch (error) {
      toast.error('Failed to load classes');
    }
  };

  const fetchClassStats = async () => {
    try {
      const { data } = await getClassAttendanceSummary(selectedClass, {
        startDate: date,
        endDate: date,
      });
      setClassStats(data);
    } catch (error) {
      // Ignore
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    const cls = classes.find((c) => c._id === classId);
    setSelectedClassName(cls?.name || '');
  };

  const teacherInfo = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Take Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mark student attendance for your classes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Mode
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'manual'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiGrid className="w-4 h-4 inline mr-1" />
                  Manual
                </button>
                <button
                  onClick={() => setMode('qr')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'qr'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiCamera className="w-4 h-4 inline mr-1" />
                  QR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {classStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AttendanceStatsCard
              title="Total Records"
              value={classStats.total}
              icon={FiCheckSquare}
              color="blue"
            />
            <AttendanceStatsCard
              title="Present"
              value={classStats.present}
              subtitle={`${classStats.percentage}%`}
              icon={FiUserCheck}
              color="green"
              percentage={classStats.percentage}
            />
            <AttendanceStatsCard
              title="Absent / Late"
              value={(classStats.absent || 0) + (classStats.late || 0)}
              icon={FiClock}
              color="red"
            />
          </div>
        )}

        {/* Content */}
        {mode === 'manual' ? (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiGrid className="w-4 h-4 text-sky-500" />
              Manual Attendance
            </h3>
            <MarkAttendanceForm
              classId={selectedClass}
              selectedDate={date}
              role="teacher"
              onSave={fetchClassStats}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QRGenerator
              classId={selectedClass}
              className={selectedClassName}
              date={date}
              teacherName={teacherInfo.name || 'Teacher'}
            />
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiCamera className="w-4 h-4 text-sky-500" />
                QR Scan Log
              </h3>
              <p className="text-sm text-gray-400 text-center py-8">
                Students will appear here as they scan the QR code.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherAttendancePage;
