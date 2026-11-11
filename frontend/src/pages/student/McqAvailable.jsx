import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCheckSquare, FiClock, FiBook, FiUser } from 'react-icons/fi';

const McqAvailable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get('/mcq-exams/available');
        setExams(data.exams || []);
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <Layout role="student"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="student">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📝 Available MCQs</h1>

        {exams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiCheckSquare className="mx-auto text-4xl text-gray-300 mb-3" />
            <p>No MCQ exams available for your class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => (
              <div key={exam._id} className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-lg text-gray-900">{exam.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{exam.subjectName || exam.subject}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                  <span className="flex items-center gap-1"><FiClock /> {exam.duration} min</span>
                  <span className="flex items-center gap-1"><FiBook /> {exam.questionsCount} Qs</span>
                  <span className="flex items-center gap-1"><FiUser /> {exam.teacherId?.userId?.name}</span>
                </div>
                <Link
                  to={`/student/mcq-exams/${exam._id}/take`}
                  className="mt-4 w-full bg-blue-600 text-white text-center py-2.5 rounded-xl font-medium hover:bg-blue-700 transition block"
                >
                  Take Exam
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default McqAvailable;