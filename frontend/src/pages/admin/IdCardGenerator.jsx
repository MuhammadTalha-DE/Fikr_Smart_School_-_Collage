import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiDownload, FiUser, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const IdCardGenerator = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students'); // adjust if paginated
      setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const downloadStudentCard = async () => {
    if (!selectedStudent) return toast.error('Please select a student');
    try {
      const response = await api.get(`/id-cards/student/${selectedStudent}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_id_card.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ID card downloaded');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const downloadTeacherCard = async () => {
    if (!selectedTeacher) return toast.error('Please select a teacher');
    try {
      const response = await api.get(`/id-cards/teacher/${selectedTeacher}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'teacher_id_card.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ID card downloaded');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">ID Card Generator</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student ID Card */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" /> Student ID Card
            </h2>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.userId?.name || s._id} ({s.classId?.name || 'N/A'})</option>
              ))}
            </select>
            <button
              onClick={downloadStudentCard}
              className="btn-primary flex items-center gap-2 w-full justify-center"
            >
              <FiDownload /> Download PDF
            </button>
          </div>

          {/* Teacher ID Card */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiUser className="text-green-600" /> Teacher ID Card
            </h2>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.userId?.name || t._id}</option>
              ))}
            </select>
            <button
              onClick={downloadTeacherCard}
              className="btn-primary flex items-center gap-2 w-full justify-center"
            >
              <FiDownload /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IdCardGenerator;