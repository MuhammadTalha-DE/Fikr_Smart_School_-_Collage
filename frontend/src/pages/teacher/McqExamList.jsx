import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSend } from 'react-icons/fi';

const McqExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/mcq-exams');
      setExams(data.exams);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this MCQ exam?')) return;
    try {
      await api.delete(`/mcq-exams/${id}`);
      toast.success('Deleted');
      fetchExams();
    } catch { toast.error('Delete failed'); }
  };

  const handleTogglePublish = async (id, current) => {
    try {
      await api.put(`/mcq-exams/${id}/publish`);
      toast.success(current ? 'Unpublished' : 'Published');
      fetchExams();
    } catch { toast.error('Toggle failed'); }
  };

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📝 MCQ Exams</h1>
          <Link to="/teacher/mcq-exams/create" className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <FiPlus /> Create MCQ
          </Link>
        </div>

        {loading ? <p className="text-gray-500">Loading…</p> : exams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No MCQ exams yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => (
              <div key={exam._id} className="bg-white rounded-2xl border p-5 shadow-sm">
                <h3 className="font-bold text-lg">{exam.title}</h3>
                <p className="text-sm text-gray-500">
  {exam.classId?.name} · {exam.subjectName || exam.subject}
</p>
                <p className="text-sm text-gray-500">{exam.questions?.length || 0} questions · {exam.duration} min</p>
                <div className="flex items-center gap-2 mt-3">
                  {exam.isPublished ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Published</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Draft</span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div className="flex gap-2">
                    <Link to={`/teacher/mcq-exams/${exam._id}/edit`} className="text-blue-600 hover:text-blue-800"><FiEdit2 /></Link>
                    <button onClick={() => handleDelete(exam._id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                    <Link to={`/teacher/mcq-exams/${exam._id}/results`} className="text-green-600 hover:text-green-800"><FiEye /></Link>
                  </div>
                  <button
                    onClick={() => handleTogglePublish(exam._id, exam.isPublished)}
                    className={`text-sm font-medium ${exam.isPublished ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {exam.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default McqExamList;