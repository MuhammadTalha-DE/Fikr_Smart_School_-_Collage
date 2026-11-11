import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiAward, FiChevronLeft } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';

const ChildBehaviour = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalPoints: 0 });
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, summaryRes, childRes] = await Promise.all([
        api.get(`/behaviour/child/${childId}/logs`),
        api.get(`/behaviour/child/${childId}/summary`),
        api.get(`/students/${childId}`),
      ]);
      setLogs(logsRes.data.logs || []);
      setSummary(summaryRes.data);
      setChild(childRes.data);
    } catch (err) {
      console.error('Failed to load child behaviour', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout role="parent"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="parent">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar src={child?.userId?.avatar} name={child?.userId?.name} size="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{child?.userId?.name} – Behaviour</h1>
              <p className="text-sm text-gray-500">Roll No: {child?.rollNumber || '—'}</p>
            </div>
          </div>
        </div>

        {/* Merit Score */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${
              summary.totalPoints >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <FiAward size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Merit Points</p>
              <p className={`text-3xl font-bold ${
                summary.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.totalPoints > 0 ? '+' : ''}{summary.totalPoints}
              </p>
            </div>
          </div>
        </div>

        {/* Behaviour Logs */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <h2 className="font-semibold p-5 border-b">Behaviour History</h2>
          {logs.length === 0 ? (
            <p className="p-5 text-gray-500">No behaviour records yet.</p>
          ) : (
            <div className="space-y-0 divide-y">
              {logs.map(log => (
                <div
                  key={log._id}
                  className={`p-4 border-l-4 ${
                    log.type === 'positive' ? 'border-l-green-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.type === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.category?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-sm text-gray-700 mt-2">{log.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.date).toLocaleDateString()} · Teacher: {log.teacher?.userId?.name}
                      </p>
                    </div>
                    <span className={`font-bold ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.points > 0 ? '+' : ''}{log.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChildBehaviour;