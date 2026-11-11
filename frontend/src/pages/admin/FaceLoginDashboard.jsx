import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import {
  FiCamera, FiUserCheck, FiAlertTriangle, FiShield,
  FiActivity, FiUsers, FiEye, FiXCircle, FiCheckCircle,
  FiRefreshCw, FiDownload, FiTrendingUp, FiTrendingDown,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import RecoveryForm from '../../components/face/RecoveryForm';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const FaceLoginDashboard = () => {
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    todayLogins: 0,
    failedToday: 0,
    spoofToday: 0,
  });
  const [trends, setTrends] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('username'); // username | camera | liv

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, trendsRes, roleRes, usersRes, logsRes] = await Promise.all([
        api.get('/face/analytics'),
        api.get('/face/trends'),
        api.get('/face/by-role'),
        api.get('/face/enrolled-users'),
        api.get('/face/logs?limit=20'),
      ]);
      setStats(analyticsRes.data);
      setTrends(trendsRes.data);
      setRoleData(roleRes.data);
      setEnrolledUsers(usersRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch face analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Chart Data ─────────────────────────────────
  const trendChartData = {
    labels: trends.map(t => t._id.slice(5)),
    datasets: [
      {
        label: 'Successful',
        data: trends.map(t => t.success),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Failed',
        data: trends.map(t => t.failed),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Spoofed',
        data: trends.map(t => t.spoofed),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const rolePieData = {
    labels: roleData.map(r => r._id || 'Unknown'),
    datasets: [{
      data: roleData.map(r => r.total),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    }],
  };

  const spoofPieData = {
    labels: ['Real', 'Spoofed'],
    datasets: [{
      data: [stats.todayLogins, stats.spoofToday],
      backgroundColor: ['#10b981', '#ef4444'],
    }],
  };

  // ─── Stat Cards ─────────────────────────────────
  const statCards = [
    { title: 'Enrolled Users', value: stats.totalEnrolled, icon: FiUserCheck, color: 'from-indigo-500 to-blue-500', delay: 0 },
    { title: 'Today\'s Logins', value: stats.todayLogins, icon: FiCamera, color: 'from-emerald-500 to-green-500', delay: 0.1 },
    { title: 'Failed Attempts', value: stats.failedToday, icon: FiXCircle, color: 'from-red-500 to-pink-500', delay: 0.2 },
    { title: 'Spoofing Detected', value: stats.spoofToday, icon: FiAlertTriangle, color: 'from-amber-500 to-orange-500', delay: 0.3 },
  ];

  // ─── Render ─────────────────────────────────────
  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-4 md:p-6 relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-indigo-400/30 rounded-full blur-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
              }}
              animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 4 + Math.random() * 4, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
                <FiCamera className="text-indigo-400 w-10 h-10 animate-pulse" />
                Face Login Dashboard
              </h1>
              <p className="text-gray-400 mt-2">Biometric authentication analytics & security monitoring</p>
            </div>
            <button
              onClick={fetchAllData}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
              title="Refresh"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.delay }}
                whileHover={{ scale: 1.03, rotateY: 2 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="text-white text-xl" />
                  </div>
                  {idx === 1 && <FiTrendingUp className="text-green-400 text-lg" />}
                  {idx === 2 && <FiTrendingDown className="text-red-400 text-lg" />}
                </div>
                <p className="text-3xl font-extrabold text-white">
                  <CountUp end={card.value} duration={2} />
                </p>
                <p className="text-gray-400 text-sm mt-1">{card.title}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['overview', 'trends', 'enrolled', 'logs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Logins by Role</h3>
                <div className="h-64">
                  <Pie data={rolePieData} options={{
                    plugins: { legend: { labels: { color: 'white', font: { size: 12 } } } }
                  }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Spoof Detection</h3>
                <div className="h-64">
                  <Pie data={spoofPieData} options={{
                    plugins: { legend: { labels: { color: 'white', font: { size: 12 } } } }
                  }} />
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">30-Day Login Trends</h3>
              <div className="h-80">
                <Line data={trendChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: 'white' } } },
                  scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  }
                }} />
              </div>
            </motion.div>
          )}

          {activeTab === 'enrolled' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Enrolled Users</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledUsers.length === 0 ? (
                  <p className="text-gray-400 col-span-full text-center py-8">No users enrolled yet.</p>
                ) : (
                  enrolledUsers.map(user => (
                    <div key={user._id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {user.user?.avatar ? (
                          <img src={user.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FiUserCheck className="text-white text-xl" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.user?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-xs capitalize">{user.user?.role}</p>
                        <p className="text-gray-500 text-[10px]">
                          Last login: {user.lastVerified ? format(new Date(user.lastVerified), 'MMM dd, HH:mm') : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Recent Login Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-white text-sm">
                  <thead className="border-b border-white/20">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Confidence</th>
                      <th className="p-3 text-left">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">
                            {log.userId?.name?.charAt(0) || '?'}
                          </div>
                          {log.userId?.name || 'Unknown'}
                        </td>
                        <td className="p-3 text-gray-400">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.success ? <FiCheckCircle className="inline mr-1" /> : <FiXCircle className="inline mr-1" />}
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                          {log.spoofDetected && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                              <FiAlertTriangle className="inline mr-1" /> Spoof
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">
                          {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="p-3 text-gray-400 text-xs max-w-[150px] truncate">
                          {log.device || 'Unknown'}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400">No logs yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FaceLoginDashboard;