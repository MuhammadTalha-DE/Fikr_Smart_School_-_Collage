import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiDownload, FiBarChart2, FiRefreshCw,
  FiAward, FiUsers, FiTrendingUp, FiClock
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const McqExamResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'analytics'

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [examRes, subsRes, analyticsRes] = await Promise.all([
        api.get(`/mcq-exams/${id}`),
        api.get(`/mcq-exams/${id}/results`),
        api.get(`/mcq-exams/${id}/analytics`),
      ]);
      setExam(examRes.data.exam);
      setSubmissions(subsRes.data.submissions || []);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (submissions.length === 0) return toast.error('No data to export');
    const rows = submissions.map((sub, idx) => [
      idx + 1,
      sub.studentId?.userId?.name || '',
      sub.studentId?.rollNumber || '',
      sub.score,
      sub.totalMarks,
      `${Math.round((sub.score / sub.totalMarks) * 100)}%`,
      sub.timeTaken ? `${Math.floor(sub.timeTaken / 60)}m ${sub.timeTaken % 60}s` : '—',
      new Date(sub.submittedAt).toLocaleString(),
    ]);
    const csv = [['Rank', 'Student', 'Roll No', 'Score', 'Total', '%', 'Time', 'Submitted'], ...rows]
      .map(row => row.map(c => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mcq-results-${exam?.title || 'export'}.csv`;
    a.click();
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam?.title} – Results</h1>
              <p className="text-sm text-gray-500">
                {exam?.classId?.name} · {exam?.subject} · {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <FiDownload /> CSV
            </button>
            <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['results', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {tab === 'results' ? '📋 Student Results' : '📊 Question Analytics'}
            </button>
          ))}
        </div>

        {/* Results Tab */}
        {activeTab === 'results' && (
          submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border">
              <FiUsers className="mx-auto text-4xl text-gray-300 mb-3" />
              <p>No students have taken this exam yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Roll No</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">%</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Time</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub, idx) => (
                    <tr key={sub._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={sub.studentId?.userId?.avatar}
                            name={sub.studentId?.userId?.name}
                            size="w-8 h-8"
                          />
                          <span className="font-medium text-gray-900">{sub.studentId?.userId?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                        {sub.studentId?.rollNumber || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {sub.score}/{sub.totalMarks}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(sub.score / sub.totalMarks) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round((sub.score / sub.totalMarks) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {sub.timeTaken ? `${Math.floor(sub.timeTaken / 60)}m ${sub.timeTaken % 60}s` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
                <FiUsers className="mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold">{analytics.totalStudents}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
                <FiTrendingUp className="mx-auto text-green-500 mb-1" />
                <p className="text-2xl font-bold">{analytics.averageScore}</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
                <FiAward className="mx-auto text-yellow-500 mb-1" />
                <p className="text-2xl font-bold">{analytics.highestScore}</p>
                <p className="text-xs text-gray-500">Highest</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
                <FiTrendingUp className="mx-auto text-red-500 mb-1 rotate-180" />
                <p className="text-2xl font-bold">{analytics.lowestScore}</p>
                <p className="text-xs text-gray-500">Lowest</p>
              </div>
            </div>

            {/* Per‑Question Stats */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Per‑Question Performance</h2>
              {analytics.questionStats.map((qStat, idx) => (
                <div key={idx} className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="font-medium mb-3">Q{idx + 1}. {qStat.questionText}</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${qStat.correctPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-green-700 w-12 text-right">
                      {qStat.correctPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {qStat.correctCount}/{qStat.totalAnswers} correct
                  </p>
                  {/* Option distribution */}
                  <div className="flex gap-2 mt-2">
                    {qStat.optionDistribution.map(opt => (
                      <div
                        key={opt.option}
                        className={`flex-1 text-center p-2 rounded-lg text-xs ${
                          opt.option === String.fromCharCode(65 + qStat.correctOption)
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opt.option}: {opt.count}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default McqExamResults;