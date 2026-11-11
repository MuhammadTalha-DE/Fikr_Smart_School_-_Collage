import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiAward, FiDownload, FiSend, FiRefreshCw,
  FiTrash2, FiFileText, FiUsers, FiCalendar
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const ExamResults = () => {
  const { examId } = useParams();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [examId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [examRes, resultsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/results/exams/${examId}/results`),
      ]);
      setExam(examRes.data);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : []);
    } catch (err) {
      toast.error('Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(
      results.length > 0
        ? 'Re‑calculate and publish results? Existing results will be overwritten.'
        : 'Calculate and publish results for this exam?'
    )) return;

    setPublishing(true);
    try {
      const { data } = await api.post(`/results/exams/${examId}/publish-results`);
      toast.success(data.message || 'Results published');
      // Refetch to get the fresh results with student details
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Delete all results for this exam? This cannot be undone.')) return;
    setResetting(true);
    try {
      await api.delete(`/results/exams/${examId}/reset`);
      toast.success('Results cleared');
      setResults([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return toast.error('No results to export');
    const rows = results.map((r) => {
      const subjects = r.subjectResults
        .map((s) => `${s.subject}:${s.marksObtained}/${s.maxMarks}`)
        .join('; ');
      return [
        r.classRank,
        r.studentId?.userId?.name || '',
        r.studentId?.rollNumber || '',
        subjects,
        `${r.totalMarksObtained}/${r.totalMaxMarks}`,
        `${r.overallPercentage}%`,
        r.overallGrade,
        r.overallGPA,
      ];
    });
    const csv = [
      ['Rank', 'Student', 'Roll No', 'Subjects', 'Total', '%', 'Grade', 'GPA'],
      ...rows,
    ]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `exam-results-${exam?.name || 'export'}.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <Layout role="teacher">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiAward className="text-purple-600" /> Exam Results
            </h1>
            {exam && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                <span className="font-medium text-gray-700">{exam.name}</span>
                <span className="flex items-center gap-1">
                  <FiUsers className="w-4 h-4" /> {exam.classId?.name}
                </span>
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" /> {new Date(exam.date).toLocaleDateString()}
                </span>
                {results.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {results.length} student{results.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-60"
            >
              {publishing ? (
                <>
                  <FiRefreshCw className="animate-spin" /> Calculating…
                </>
              ) : results.length > 0 ? (
                <>
                  <FiRefreshCw /> Re‑publish
                </>
              ) : (
                <>
                  <FiSend /> Publish Results
                </>
              )}
            </button>

            {results.length > 0 && (
              <>
                <button
                  onClick={exportCSV}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiDownload /> CSV
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="btn-secondary text-red-600 flex items-center gap-2"
                >
                  <FiTrash2 /> {resetting ? 'Resetting…' : 'Reset'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Empty State */}
        {results.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm">
            <FiFileText className="mx-auto text-5xl text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Marks have not been calculated for this exam. Click <strong>"Publish Results"</strong> to
              automatically compute grades, GPAs, and class ranks.
            </p>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition"
            >
              <FiSend /> Publish Results
            </button>
          </div>
        ) : (
          /* Results Table */
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">Rank</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">Student</th>
                    {results[0]?.subjectResults.map((sub) => (
                      <th
                        key={sub.subject}
                        className="px-4 py-3.5 text-left font-semibold text-gray-700"
                      >
                        {sub.subject}
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">%</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            r.classRank === 1
                              ? 'bg-yellow-100 text-yellow-800'
                              : r.classRank === 2
                              ? 'bg-gray-200 text-gray-700'
                              : r.classRank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-gray-600'
                          }`}
                        >
                          {r.classRank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={r.studentId?.userId?.avatar}
                            name={r.studentId?.userId?.name}
                            size="w-8 h-8"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {r.studentId?.userId?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Roll No: {r.studentId?.rollNumber || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {r.subjectResults.map((sub) => (
                        <td key={sub.subject} className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {sub.marksObtained}/{sub.maxMarks}
                          </div>
                          <div className="text-xs text-gray-500">{sub.percentage}%</div>
                          <div className="text-xs text-gray-400">{sub.grade}</div>
                        </td>
                      ))}
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {r.totalMarksObtained}/{r.totalMaxMarks}
                      </td>
                      <td className="px-4 py-3">{r.overallPercentage}%</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {r.overallGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {r.overallGPA}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Note */}
        {results.length > 0 && (
          <div className="text-center text-xs text-gray-400">
            Results are automatically calculated based on marks entered for each subject.
            You can re‑publish at any time to update grades.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamResults;