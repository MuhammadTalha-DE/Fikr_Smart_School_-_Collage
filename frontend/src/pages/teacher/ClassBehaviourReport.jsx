import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUsers, FiTrendingUp, FiThumbsUp, FiThumbsDown,
  FiAlertTriangle, FiStar, FiBarChart2
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const ClassBehaviourReport = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview | students | trends

  useEffect(() => {
    fetchReport();
  }, [classId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/behaviour/report/class/${classId}`);
      setReport(data.report);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading report…</div></Layout>;
  if (!report) return <Layout role="teacher"><div className="p-6 text-center text-red-500">Report not found.</div></Layout>;

  const views = [
    { key: 'overview', label: 'Overview', icon: FiBarChart2 },
    { key: 'students', label: 'Students', icon: FiUsers },
    { key: 'trends', label: 'Trends', icon: FiTrendingUp },
  ];

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Behaviour Report</h1>
            <p className="text-sm text-gray-500">
              {report.totalStudents} student{report.totalStudents !== 1 ? 's' : ''} · {report.totalLogs} logs
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <FiUsers className="mx-auto text-blue-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-gray-900">{report.totalStudents}</p>
            <p className="text-xs text-gray-500">Students</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <FiThumbsUp className="mx-auto text-green-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-green-600">{report.positiveLogs}</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <FiThumbsDown className="mx-auto text-red-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-red-600">{report.negativeLogs}</p>
            <p className="text-xs text-gray-500">Negative</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <FiAlertTriangle className="mx-auto text-amber-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-amber-600">
              {report.studentReport.filter(s => s.status === 'critical' || s.status === 'warning').length}
            </p>
            <p className="text-xs text-gray-500">At Risk</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {views.map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
                activeView === view.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <view.icon className="w-4 h-4" /> {view.label}
            </button>
          ))}
        </div>

        {/* Overview – Category Distribution */}
        {activeView === 'overview' && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Behaviour Categories</h2>
            <div className="space-y-3">
              {Object.entries(report.categoryDistribution).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-gray-600 capitalize">{cat}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${(count / report.totalLogs) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        {activeView === 'students' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Roll No</th>
                    <th className="px-4 py-3 text-center">Points</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Positive</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Negative</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.studentReport.map(s => (
                    <tr key={s.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={s.avatar} name={s.name} size="w-8 h-8" />
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-500">{s.rollNumber}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        <span className={s.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {s.totalPoints > 0 ? '+' : ''}{s.totalPoints}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell text-green-600">{s.positiveCount}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell text-red-600">{s.negativeCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          s.status === 'excellent' ? 'bg-green-100 text-green-700' :
                          s.status === 'good' ? 'bg-blue-100 text-blue-700' :
                          s.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Trends */}
        {activeView === 'trends' && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Monthly Trend</h2>
            <div className="space-y-4">
              {Object.entries(report.monthlyTrend).map(([month, data]) => (
                <div key={month} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-600">{month}</span>
                  <div className="flex-1 flex items-center gap-1 h-6">
                    <div
                      className="bg-green-400 h-full rounded-l"
                      style={{ width: `${Math.max((data.positive / Math.max(data.positive + data.negative, 1)) * 100, 0)}%` }}
                    />
                    <div
                      className="bg-red-400 h-full rounded-r"
                      style={{ width: `${Math.max((data.negative / Math.max(data.positive + data.negative, 1)) * 100, 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    +{data.positive} / -{data.negative}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassBehaviourReport;