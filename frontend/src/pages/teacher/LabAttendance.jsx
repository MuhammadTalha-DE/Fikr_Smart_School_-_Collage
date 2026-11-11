import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionAndStudents();
  }, [sessionId]);

  const fetchSessionAndStudents = async () => {
    try {
      const [sessionRes] = await Promise.all([
        api.get(`/lab/sessions/${sessionId}`),
      ]);
      const sess = sessionRes.data;
      setSession(sess);

      // fetch students of the class
      const studentsRes = await api.get(`/classes/${sess.classId._id}/students`);
      setStudents(studentsRes.data);

      // pre‑fill attendance from session (if exists)
      const existingAttendance = sess.attendance || [];
      const attMap = {};
      existingAttendance.forEach(a => {
        attMap[a.studentId._id] = a.status;
      });
      setAttendance(attMap);
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status: status || 'present',
    }));
    try {
      await api.post('/lab/sessions/attendance', { sessionId, records });
      toast.success('Attendance saved');
      navigate('/teacher/lab');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading...</div></Layout>;
  if (!session) return <Layout role="teacher"><div className="p-6 text-center text-red-500">Session not found.</div></Layout>;

  return (
    <Layout role="teacher">
      <h1 className="text-2xl font-bold mb-2">Lab Attendance</h1>
      <p className="text-gray-500 mb-4">{session.topic} — {session.labId?.name} — {new Date(session.date).toLocaleDateString()}</p>

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Roll No</th>
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s._id} className="border-b">
                <td className="py-2">{s.rollNumber || '—'}</td>
                <td className="py-2">{s.userId?.name}</td>
                <td className="py-2">
                  <select
                    value={attendance[s._id] || 'present'}
                    onChange={(e) => handleStatusChange(s._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default LabAttendance;