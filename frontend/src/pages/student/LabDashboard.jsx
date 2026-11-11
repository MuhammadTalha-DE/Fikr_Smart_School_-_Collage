import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiBook, FiClock, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const StudentLabDashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/lab/student/sessions'),
      ]);
      if (profileRes.data.student) {
        setStudentId(profileRes.data.student._id);
      }
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Failed to load lab data', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get attendance status for current student
  const getAttendanceStatus = (session) => {
    if (!studentId || !session.attendance) return null;
    const record = session.attendance.find(a => a.studentId?._id === studentId);
    return record ? record.status : null;
  };

  return (
    <Layout role="student">
      <h1 className="text-2xl font-bold mb-6">My Lab Sessions</h1>

      {loading ? (
        <p className="text-gray-500">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No lab sessions scheduled for your class.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => {
            const status = getAttendanceStatus(s);
            return (
              <div key={s._id} className="bg-white p-5 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center">
                      <FiBook className="mr-2 text-primary-500" />
                      {s.topic || 'No topic'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Lab:</span> {s.labId?.name}</p>
                      <p><span className="font-medium">Teacher:</span> {s.teacherId?.userId?.name}</p>
                      <p className="flex items-center">
                        <FiCalendar className="mr-1" /> {new Date(s.date).toLocaleDateString()}
                        {s.startTime && (
                          <span className="ml-2"><FiClock className="inline mr-1" />{s.startTime} - {s.endTime}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    {status === 'present' ? (
                      <span className="text-green-600 flex items-center">
                        <FiCheckCircle className="mr-1" /> Present
                      </span>
                    ) : status === 'absent' ? (
                      <span className="text-red-600 flex items-center">
                        <FiXCircle className="mr-1" /> Absent
                      </span>
                    ) : (
                      <span className="text-gray-400">No record</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default StudentLabDashboard;