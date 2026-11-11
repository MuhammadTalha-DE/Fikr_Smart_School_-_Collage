import { useState, useEffect,useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';  
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUsers, FiBook, FiClock, FiCalendar, FiBarChart2,
  FiPlus, FiTrash2, FiEdit2
} from 'react-icons/fi';
import Select from 'react-select';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); // roster, timetable, attendance, marks
  const { periods } = useSchoolPeriods();

  // Roster
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

   

  // Timetable
  const [timetable, setTimetable] = useState(null);

  // Attendance
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  // Marks
  const [recentMarks, setRecentMarks] = useState([]);
   // 🔥 Fetch real subjects and build a name map
  const { data: realSubjects } = useDropdownData('/subjects', 'subjects');
  const subjectNameMap = useMemo(() => {
    const map = {};
    (realSubjects || []).forEach(s => { map[s._id] = s.name; });
    return map;
  }, [realSubjects]);

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const { data } = await api.get(`/classes/${id}`);
      setClassData(data);
      fetchStudents();
      fetchTimetable();
      fetchAttendanceSummary();
      fetchRecentMarks();
      fetchAllStudents();
    } catch (error) {
      toast.error('Failed to load class');
      navigate('/admin/classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get(`/classes/${id}/students`);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setAllStudents(data);
    } catch (error) {
      console.error('Failed to load all students', error);
    }
  };

  const fetchTimetable = async () => {
    try {
      const { data } = await api.get(`/timetables/${id}`, {
        params: { status: 'published', date: new Date().toISOString() },
      });
      setTimetable(data);
    } catch (error) {
      console.error('Failed to load timetable', error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const { data } = await api.get(`/classes/${id}/attendance-summary`);
      setAttendanceSummary(data);
    } catch (error) {
      console.error('Failed to load attendance summary', error);
    }
  };

  const fetchRecentMarks = async () => {
    try {
      const { data } = await api.get(`/classes/${id}/recent-marks`);
      setRecentMarks(data);
    } catch (error) {
      console.error('Failed to load recent marks', error);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) return;
    try {
      await api.post(`/classes/${id}/students`, { studentId: selectedStudentToAdd });
      toast.success('Student added');
      fetchStudents();
      setSelectedStudentToAdd('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;
    try {
      await api.delete(`/classes/${id}/students/${studentId}`);
      toast.success('Student removed');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center">Loading class…</div></Layout>;
  if (!classData) return <Layout role="admin"><div className="p-6 text-center text-red-500">Class not found.</div></Layout>;

  const availableStudents = allStudents.filter(s => !students.find(st => st._id === s._id));
  const studentOptions = availableStudents.map(s => ({
    value: s._id,
    label: `${s.userId?.name} (${s.rollNumber || 'N/A'})`,
  }));

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (
    <Layout role="admin">
      {/* Header */}
         <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/classes')} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{classData.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Teacher: {classData.teacherId?.userId?.name || 'Not assigned'} | Subjects:{' '}
              {classData.subjects?.map(subId => subjectNameMap[subId] || subId).join(', ') || 'None'}
            </p>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('roster')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'roster' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            <FiUsers className="inline mr-2" /> Roster
          </button>
          <button onClick={() => setActiveTab('timetable')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'timetable' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            <FiClock className="inline mr-2" /> Timetable
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            <FiCalendar className="inline mr-2" /> Attendance
          </button>
          <button onClick={() => setActiveTab('marks')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'marks' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            <FiBarChart2 className="inline mr-2" /> Marks
          </button>
        </nav>
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-sm border border-pink-100 p-6">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Add Student</label>
              <Select
                options={studentOptions}
                value={studentOptions.find(o => o.value === selectedStudentToAdd) || null}
                onChange={(opt) => setSelectedStudentToAdd(opt?.value || '')}
                placeholder="Search student to add..."
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <button onClick={handleAddStudent} disabled={!selectedStudentToAdd} className="btn-primary">
              <FiPlus className="mr-1" /> Add
            </button>
          </div>

          {students.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Roll No</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Parent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map(s => (
                    <tr key={s._id}>
                      <td className="px-4 py-3">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/students/${s._id}`} className="text-primary-600 hover:underline font-medium">
                          {s.userId?.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{s.parentId?.userId?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleRemoveStudent(s._id)} className="text-red-600 hover:text-red-800">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-sm border border-pink-100 p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Class Timetable</h3>
          {timetable?.slots?.length > 0 ? (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="border p-2">Day/Period</th>
                  {periods.map(p => <th key={p} className="border p-2">P{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map(day => (
                  <tr key={day}>
                    <td className="border p-2 font-medium">{day}</td>
                    {periods.map(period => {
                      const slot = timetable.slots.find(s => s.day === day && s.period === period);
                      return (
                        <td key={period} className="border p-2 text-center text-sm">
                          {slot ? (
                            <div>
                              <div className="font-medium">{slot.subject}</div>
                              <div className="text-xs text-gray-500">{slot.teacherId?.userId?.name}</div>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No timetable published yet.</p>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-sm border border-pink-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Summary (Last 30 Days)</h3>
          {attendanceSummary ? (
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{attendanceSummary.percentage}%</p>
                <p className="text-sm text-gray-500">Present</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{attendanceSummary.total}</p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No attendance data available.</p>
          )}
        </div>
      )}

      {/* Marks Tab */}
      {activeTab === 'marks' && (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-sm border border-pink-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Marks</h3>
          {recentMarks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Exam</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentMarks.map(m => (
                    <tr key={m._id}>
                      <td className="px-4 py-3">{m.studentId?.userId?.name}</td>
                      <td className="px-4 py-3">{m.subject}</td>
                      <td className="px-4 py-3">{m.examType}</td>
                      <td className="px-4 py-3 font-medium">{m.marksObtained}/{m.totalMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No marks recorded yet.</p>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ClassDetail;
