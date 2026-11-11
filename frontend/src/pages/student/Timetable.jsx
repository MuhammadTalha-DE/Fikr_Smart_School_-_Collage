import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBook, FiClock, FiUser } from 'react-icons/fi';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const { periods } = useSchoolPeriods();

  useEffect(() => {
    const fetchStudentAndTimetable = async () => {
      try {
        const { data: studentData } = await api.get('/students/me');
        const classId = studentData?.classId?._id || studentData?.classId;

        if (classId) {
          const { data: timetableData } = await api.get(`/timetables/${classId}`, {
            params: { status: 'published', date: new Date().toISOString() },
          });
          setTimetable(timetableData);
        } else {
          toast.error('You are not assigned to a class');
        }
      } catch (err) {
        toast.error('Could not load your timetable');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndTimetable();
  }, []);

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center">Loading timetable...</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiClock className="text-blue-600" /> My Timetable
        </h1>

        {timetable?.slots?.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-700">Day / Period</th>
                  {periods.map((period) => (
                    <th key={period} className="p-3 text-left font-medium text-gray-700">Period {period}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {days.map((day) => (
                  <tr key={day}>
                    <td className="p-3 font-medium text-gray-700">{day}</td>
                    {periods.map((period) => {
                      const slot = timetable.slots?.find((item) => item.day === day && Number(item.period) === Number(period));
                      return (
                        <td key={period} className="p-3">
                          {slot ? (
                            <div className="bg-blue-50 rounded-lg p-2">
                              <div className="font-medium text-gray-900">{slot.subject}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <FiUser size={12} />
                                {slot.teacherId?.userId?.name || 'Teacher'}
                              </div>
                              {slot.roomId?.name && (
                                <div className="text-xs text-gray-400 mt-0.5">Room: {slot.roomId.name}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-300 text-xs">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiBook className="mx-auto mb-3 text-gray-300" size={32} />
            <p>No timetable published for your class yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentTimetable;
