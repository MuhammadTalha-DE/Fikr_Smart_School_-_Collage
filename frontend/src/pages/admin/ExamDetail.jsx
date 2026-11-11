import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiCalendar, FiBook, FiAward, FiSend,
  FiCheckCircle, FiXCircle, FiUsers
} from 'react-icons/fi';

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchExam();
    fetchResults();
  }, [id]);

  const fetchExam = async () => {
    try {
      const { data } = await api.get(`/exams/${id}`);
      setExam(data);
    } catch (error) {
      toast.error('Failed to load exam details');
      navigate('/admin/exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const { data } = await api.get(`/results/exams/${id}`);
      setResults(data);
    } catch (error) {
      // Results may not exist yet — that's fine
      setResults([]);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish results for this exam? This will calculate grades and ranks for all students in the class.')) return;
    setPublishing(true);
    try {
      await api.post(`/results/exams/${id}/publish-results`);
      toast.success('Results published');
      fetchResults(); // reload the table
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center text-gray-900 dark:text-gray-100">Loading exam…</div></Layout>;
  if (!exam) return <Layout role="admin"><div className="p-6 text-center text-red-500">Exam not found.</div></Layout>;

  const published = results.length > 0;

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/exams')} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{exam.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
              <span className="flex items-center"><FiBook className="mr-1" /> {exam.classId?.name}</span>
              <span className="flex items-center"><FiCalendar className="mr-1" /> {new Date(exam.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!published && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn-primary text-sm text-white flex items-center gap-1"
            >
              <FiSend /> {publishing ? 'Publishing…' : 'Publish Results'}
            </button>
          )}
        </div>
      </div>

      {/* Subjects Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {exam.subjects.map(sub => (
          <span key={sub} className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-medium">
            {sub}
          </span>
        ))}
      </div>

      {/* Results Table or Empty State */}
      {!published ? (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FiAward className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Results have not been published yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Click the <strong>“Publish Results”</strong> button to generate grades and class rank.
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student</th>
                {exam.subjects.map(sub => (
                  <th key={sub} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{sub}</th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map(r => {
                // Build a map of subject -> marks for quick lookup
                const subjectMap = {};
                r.subjectResults.forEach(sub => { subjectMap[sub.subject] = sub; });
                return (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-bold text-lg">#{r.classRank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {r.studentId?.userId?.name}
                    </td>
                    {exam.subjects.map(sub => {
                      const mark = subjectMap[sub];
                      return (
                        <td key={sub} className="px-4 py-3 text-sm">
                          {mark ? (
                            <span>
                              {mark.marksObtained}/{mark.maxMarks}
                              <span className="text-xs text-gray-500 ml-1">({mark.percentage}%)</span>
                              <br />
                              <span className="text-xs text-gray-400">{mark.grade}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 font-medium">{r.totalMarksObtained}/{r.totalMaxMarks}</td>
                    <td className="px-4 py-3">{r.overallPercentage}%</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm font-medium">
                        {r.overallGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.overallGPA}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default ExamDetail;