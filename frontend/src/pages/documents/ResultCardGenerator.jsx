import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiDownload, FiSearch, FiBarChart2 } from 'react-icons/fi';
import { downloadBase64Pdf, filterStudents, formatStudentOption } from '../../utils/documentUtils';

const ResultCardGenerator = () => {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchExams();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setStudents((data || []).sort((a, b) => (a.userId?.name || '').localeCompare(b.userId?.name || '')));
    } catch (err) { console.error(err); }
  };

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data || []);
    } catch (err) { console.error(err); }
  };

  const filteredStudents = filterStudents(students, searchTerm);

  const handleGenerate = async () => {
    if (!selectedStudent) return toast.error('Select a student');
    setLoading(true);
    try {
      const { data } = await api.post('/documents/generate', {
        templateId: null,
        ownerType: 'student',
        ownerId: selectedStudent,
        documentType: 'result_card',
        examId: selectedExam || undefined,
      });

      downloadBase64Pdf(data.pdfBuffer, `Result_${data.metadata?.studentName || 'student'}.pdf`);
      toast.success('Result card generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Result Card Generator</h1>
        <p className="text-gray-500 mb-8">Generate result cards and marks sheets for students</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam (optional)</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="">All Exams (latest results)</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>
                  {exam.name} ({exam.type}) - {exam.classId?.name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2.5 border rounded-lg"
              />
            </div>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              size={6}
            >
              <option value="">-- Select --</option>
              {filteredStudents.map(s => (
                  <option key={s._id} value={s._id}>
                  {formatStudentOption(s)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedStudent}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
              loading || !selectedStudent
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loading ? 'Generating...' : <><FiDownload /> Generate Result Card</>}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ResultCardGenerator;
