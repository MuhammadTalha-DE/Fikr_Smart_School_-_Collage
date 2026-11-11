import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import { FiUsers, FiUserCheck, FiUserX, FiHome, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const HostelAttendancePage = () => {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning'); // 'morning' | 'night'
  const [residents, setResidents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, onLeave: 0 });

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      fetchResidents();
      fetchExistingAttendance();
    }
  }, [selectedHostel, date, session]);

  const fetchHostels = async () => {
    try {
      const { data } = await api.get('/hostels');
      setHostels(data);
      if (data.length > 0) setSelectedHostel(data[0]._id);
    } catch (error) {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const { data } = await api.get(`/hostel-residents?hostelId=${selectedHostel}`);
      setResidents(data);
      const init = {};
      data.forEach((r) => (init[r._id] = 'present'));
      setAttendance((prev) => ({ ...init, ...prev }));
    } catch (error) {
      toast.error('Failed to load residents');
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data } = await api.get(
        `/hostel-attendance?hostelId=${selectedHostel}&date=${date}`
      );
      if (data?.records) {
        const existing = {};
        data.records.forEach((r) => (existing[r.hostelStudentId] = r.status));
        setAttendance((prev) => ({ ...prev, ...existing }));
      }
    } catch (error) {
      // No existing attendance
    }
  };

  const handleStatusChange = (residentId, status) => {
    const newAttendance = { ...attendance, [residentId]: status };
    setAttendance(newAttendance);

    const present = Object.values(newAttendance).filter((s) => s === 'present').length;
    const absent = Object.values(newAttendance).filter((s) => s === 'absent').length;
    const onLeave = Object.values(newAttendance).filter((s) => s === 'on_leave').length;
    setStats({ present, absent, onLeave });
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    residents.forEach((r) => (newAttendance[r._id] = status));
    setAttendance(newAttendance);
    const present = Object.values(newAttendance).filter((s) => s === 'present').length;
    const absent = Object.values(newAttendance).filter((s) => s === 'absent').length;
    const onLeave = Object.values(newAttendance).filter((s) => s === 'on_leave').length;
    setStats({ present, absent, onLeave });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([hostelStudentId, status]) => ({
        hostelStudentId,
        status,
      }));

      await api.post('/hostel-attendance', {
        hostelId: selectedHostel,
        date,
        session,
        records,
      });

      toast.success('Hostel attendance saved!');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="warden">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hostel Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Morning & night attendance for hostel residents
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Hostel
              </label>
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {hostels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
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
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Session
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {['morning', 'night'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSession(s)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      session === s
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    {s === 'morning' ? '🌅 Morning' : '🌙 Night'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AttendanceStatsCard
            title="Total Residents"
            value={residents.length}
            icon={FiUsers}
            color="blue"
          />
          <AttendanceStatsCard
            title="Present"
            value={stats.present}
            icon={FiUserCheck}
            color="green"
          />
          <AttendanceStatsCard
            title="Absent"
            value={stats.absent}
            icon={FiUserX}
            color="red"
          />
          <AttendanceStatsCard
            title="On Leave"
            value={stats.onLeave}
            icon={FiClock}
            color="yellow"
          />
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">
              Resident Attendance
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {residents.map((resident, idx) => (
              <div
                key={resident._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {resident.studentId?.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {resident.studentId?.userId?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Room: {resident.roomId?.name || 'N/A'} · Bed:{' '}
                      {resident.bedId?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { value: 'present', label: 'Present', color: 'bg-green-500' },
                    { value: 'absent', label: 'Absent', color: 'bg-red-500' },
                    { value: 'on_leave', label: 'Leave', color: 'bg-blue-500' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(resident._id, opt.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        attendance[resident._id] === opt.value
                          ? `${opt.color.replace('bg-', 'bg-').replace('500', '100')} border-${opt.color.replace('bg-', '')} text-${opt.color.replace('bg-', '').replace('500', '700')}`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HostelAttendancePage;
