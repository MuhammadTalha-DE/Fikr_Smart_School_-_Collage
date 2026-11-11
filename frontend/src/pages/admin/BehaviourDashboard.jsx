import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiActivity, FiAward, FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';

const BehaviourDashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/behaviour/school-stats'),
        api.get('/behaviour/alerts'),
      ]);
      setStats(statsRes.data.stats);
      setAlerts(alertsRes.data.alerts || []);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="admin">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Behaviour Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
              <FiActivity className="mx-auto text-blue-500 mb-2" size={22} />
              <p className="text-2xl font-bold">{stats.totalLogs}</p>
              <p className="text-xs text-gray-500">Total Logs</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
              <FiAward className="mx-auto text-green-500 mb-2" size={22} />
              <p className="text-2xl font-bold text-green-600">{stats.totalPositive}</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
              <FiAlertTriangle className="mx-auto text-red-500 mb-2" size={22} />
              <p className="text-2xl font-bold text-red-600">{stats.totalNegative}</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
              <FiBarChart2 className="mx-auto text-purple-500 mb-2" size={22} />
              <p className="text-2xl font-bold">{stats.totalActivities}</p>
              <p className="text-xs text-gray-500">Activities</p>
            </div>
          </div>
        )}

        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-red-50">
              <h2 className="font-semibold text-red-800 flex items-center gap-2">
                <FiAlertTriangle /> Students Requiring Attention
              </h2>
            </div>
            <div className="divide-y">
              {alerts.map(alert => (
                <div key={alert.studentId} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{alert.studentName}</p>
                    <p className="text-sm text-gray-500">{alert.className} · Roll No: {alert.rollNumber}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    alert.level === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.totalPoints} pts
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

export default BehaviourDashboard;