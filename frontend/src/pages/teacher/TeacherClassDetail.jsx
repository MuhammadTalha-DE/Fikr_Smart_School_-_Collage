import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import {
  FiArrowLeft, FiUsers, FiMail, FiBookOpen, FiCheckSquare,
  FiClipboard, FiFileText, FiSearch, FiX, FiChevronUp, FiChevronDown,
  FiStar, FiUser
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const TeacherClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch class and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, studentsRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get(`/classes/${id}/students`),
        ]);
        setClassData(classRes.data);
        const studentList = studentsRes.data || [];
        setStudents(studentList);
        setFilteredStudents(studentList);
      } catch (error) {
        console.error('Failed to load class details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Filter students when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredStudents(
      students.filter(
        s =>
          s.userId?.name?.toLowerCase().includes(term) ||
          s.rollNumber?.toLowerCase().includes(term) ||
          s.userId?.email?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, students]);

  // Sort handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA, valB;
    switch (sortConfig.key) {
      case 'rollNumber':
        valA = a.rollNumber || '';
        valB = b.rollNumber || '';
        break;
      case 'name':
        valA = a.userId?.name || '';
        valB = b.userId?.name || '';
        break;
      case 'email':
        valA = a.userId?.email || '';
        valB = b.userId?.email || '';
        break;
      case 'parent':
        valA = a.parentId?.userId?.name || '';
        valB = b.parentId?.userId?.name || '';
        break;
      default:
        return 0;
    }
    return (valA < valB ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
  });

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="inline w-3 h-3" /> : <FiChevronDown className="inline w-3 h-3" />;
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading…</div></Layout>;
  if (!classData) return <Layout role="teacher"><div className="p-6 text-center text-red-500">Class not found.</div></Layout>;

  const classTeacherName = classData.teacherId?.userId?.name;
  const subjectList = classData.subjects || [];
  const studentCount = students.length;

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-sm text-gray-500">
              {studentCount} student{studentCount !== 1 ? 's' : ''} · {classTeacherName ? `Teacher: ${classTeacherName}` : 'No class teacher'}
            </p>
          </div>
          {/* Quick actions */}
          <div className="flex gap-2">
            <Link
              to={`/teacher/attendance?class=${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
            >
              <FiCheckSquare /> Attendance
            </Link>
            <Link
              to={`/teacher/marks?class=${id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-green-700"
            >
              <FiClipboard /> Marks
            </Link>
            <Link
              to={`/teacher/assignments?class=${id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-purple-700"
            >
              <FiFileText /> Assignments
            </Link>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FiUsers size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{studentCount}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FiBookOpen size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{subjectList.length}</p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><FiStar size={20} /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{classTeacherName || '—'}</p>
              <p className="text-xs text-gray-500">Class Teacher</p>
            </div>
          </div>
        </div>

        {/* Subjects Tags */}
        {subjectList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjectList.map((sub, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                {sub}
              </span>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Student Table */}
        {sortedStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No students match your search.' : 'No students enrolled yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('name')}
                  >
                    Student {getSortIcon('name')}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors hidden sm:table-cell"
                    onClick={() => requestSort('rollNumber')}
                  >
                    Roll No {getSortIcon('rollNumber')}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell"
                    onClick={() => requestSort('email')}
                  >
                    Email {getSortIcon('email')}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell"
                    onClick={() => requestSort('parent')}
                  >
                    Parent {getSortIcon('parent')}
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedStudents.map((student, idx) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={student.userId?.avatar}
                          name={student.userId?.name}
                          size="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{student.userId?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {student.rollNumber || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {student.userId?.email || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {student.parentId?.userId?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherClassDetail;