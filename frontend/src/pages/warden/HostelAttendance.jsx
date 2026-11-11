import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiCheck } from 'react-icons/fi';

const HostelAttendance = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [residents, setResidents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // key: hostelStudentId, value: { status, remark }
  const [existingAttendance, setExistingAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResidents();
    checkExistingAttendance(date);
  }, [date]);

  const fetchResidents = async () => {
    try {
      const { data } = await api.get('/hostel-attendance/residents');
      setResidents(data);
      // Initialize attendance map with default 'present'
      const map = {};
      data.forEach((r) => {
        map[r._id] = { status: 'present', remark: '' };
      });
      setAttendanceMap(map);
    } catch (err) {
      toast.error('Failed to load residents');
    }
  };

  const checkExistingAttendance = async (selectedDate) => {
    try {
      const { data } = await api.get(`/hostel-attendance?date=${selectedDate}`);
      if (data && data.length > 0) {
        setExistingAttendance(data[0]); // one per day
        // Pre-fill map with existing data
        const map = {};
        data[0].records.forEach((r) => {
          map[r.hostelStudentId._id || r.hostelStudentId] = {
            status: r.status,
            remark: r.remark || '',
          };
        });
        setAttendanceMap(map);
      } else {
        setExistingAttendance(null);
      }
    } catch (err) {
      // ignore if no attendance
    }
  };

  const handleStatusChange = (hostelStudentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [hostelStudentId]: { ...prev[hostelStudentId], status },
    }));
  };

  const handleRemarkChange = (hostelStudentId, remark) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [hostelStudentId]: { ...prev[hostelStudentId], remark },
    }));
  };

  const handleSubmit = async () => {
    if (existingAttendance) {
      toast.error('Attendance already marked for this date');
      return;
    }
    const attendanceData = residents.map((r) => ({
      hostelStudentId: r._id,
      status: attendanceMap[r._id]?.status || 'present',
      remark: attendanceMap[r._id]?.remark || '',
    }));
    setLoading(true);
    try {
      await api.post('/hostel-attendance', { date, attendanceData });
      toast.success('Attendance saved');
      checkExistingAttendance(date);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="warden">
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Hostel Attendance</h1>

        <div className="flex items-center gap-4 mb-6">
          <label className="font-medium">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded-lg"
          />
        </div>

        {existingAttendance && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Attendance already marked for this date. View only.
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{r.studentId?.userId?.name || 'N/A'}</td>
                  <td className="p-2">
                    <div className="flex justify-center gap-3">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`status-${r._id}`}
                          value="present"
                          checked={attendanceMap[r._id]?.status === 'present'}
                          onChange={() => handleStatusChange(r._id, 'present')}
                          disabled={!!existingAttendance}
                        />
                        <span className="text-sm">Present</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`status-${r._id}`}
                          value="absent"
                          checked={attendanceMap[r._id]?.status === 'absent'}
                          onChange={() => handleStatusChange(r._id, 'absent')}
                          disabled={!!existingAttendance}
                        />
                        <span className="text-sm">Absent</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`status-${r._id}`}
                          value="on_leave"
                          checked={attendanceMap[r._id]?.status === 'on_leave'}
                          onChange={() => handleStatusChange(r._id, 'on_leave')}
                          disabled={!!existingAttendance}
                        />
                        <span className="text-sm">On Leave</span>
                      </label>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Optional remark"
                      value={attendanceMap[r._id]?.remark || ''}
                      onChange={(e) => handleRemarkChange(r._id, e.target.value)}
                      className="w-full p-1 border rounded text-sm"
                      disabled={!!existingAttendance}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!existingAttendance && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <FiSave /> {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HostelAttendance;