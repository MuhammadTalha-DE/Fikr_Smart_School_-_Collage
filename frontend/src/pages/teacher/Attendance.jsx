import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchExistingAttendance(selectedClass, date);
    }
  }, [selectedClass, date]);

  const fetchClasses = async () => {
    const { data } = await api.get('/classes/my-classes');
    setClasses(data);
    if (data.length > 0) setSelectedClass(data[0]._id);
  };

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${classId}/students`);
      setStudents(data);
      const init = {};
      data.forEach(s => init[s._id] = 'present');
      setAttendance(init);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (classId, date) => {
    try {
      const { data } = await api.get(`/attendance?classId=${classId}&date=${date}`);
      const existing = {};
      data.forEach(rec => existing[rec.studentId._id] = rec.status);
      setAttendance(prev => ({ ...prev, ...existing }));
    } catch (error) {
      // Ignore - no previous attendance
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    students.forEach(s => newAttendance[s._id] = status);
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    try {
      await api.post('/attendance', { classId: selectedClass, date, records });
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="teacher">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Take Attendance</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field w-64"
          >
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-44"
          />
        </div>

        {loading ? (
          <p className="text-gray-500 py-4">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500 py-4">No students in this class.</p>
        ) : (
          <>
            <div className="flex space-x-3 mb-4">
              <button onClick={() => handleMarkAll('present')} className="btn-secondary text-sm">Mark All Present</button>
              <button onClick={() => handleMarkAll('absent')} className="btn-secondary text-sm">Mark All Absent</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, idx) => (
                    <tr key={student._id}>
                      <td className="px-4 py-3">{student.rollNumber || idx + 1}</td>
                      <td className="px-4 py-3">{student.userId.name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={attendance[student._id] || 'present'}
                          onChange={(e) => handleStatusChange(student._id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TeacherAttendance;