import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import {
  FiAward, FiTrendingUp, FiAlertTriangle, FiStar,
  FiUsers, FiCalendar, FiActivity, FiThumbsUp, FiThumbsDown
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const MyBehaviour = () => {
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({ totalPoints: 0, behaviourPoints: 0, activityPoints: 0 });
  const [classStats, setClassStats] = useState({ topStudents: [], classAverage: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [logsRes, activitiesRes, summaryRes, statsRes] = await Promise.all([
        api.get('/behaviour/my'),
        api.get('/behaviour/activity/my'),
        api.get('/behaviour/my-summary'),
        api.get('/behaviour/class-stats'),
      ]);
      setLogs(logsRes.data.logs || []);
      setActivities(activitiesRes.data.activities || []);
      setSummary(summaryRes.data);
      setClassStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load behaviour data', err);
    } finally {
      setLoading(false);
    }
  };

  const positiveLogs = logs.filter(l => l.type === 'positive');
  const negativeLogs = logs.filter(l => l.type === 'negative');

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border p-5 h-28 animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'logs', label: 'Behaviour Logs', icon: FiActivity },
    { key: 'activities', label: 'Activities', icon: FiAward },
    { key: 'leaderboard', label: 'Leaderboard', icon: FiUsers },
  ];

  return (
    <Layout role="student">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🌟 My Behaviour & Activities
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your conduct, participation, and achievements</p>
        </div>

        {/* Merit Summary Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`p-5 rounded-2xl shadow-sm ${
                summary.totalPoints >= 30 ? 'bg-green-100 text-green-600' :
                summary.totalPoints >= 0 ? 'bg-blue-100 text-blue-600' :
                summary.totalPoints >= -20 ? 'bg-amber-100 text-amber-600' :
                'bg-red-100 text-red-600'
              }`}>
                <FiAward size={36} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Merit Points</p>
                <p className={`text-4xl font-bold ${
                  summary.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.totalPoints > 0 ? '+' : ''}{summary.totalPoints}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Class Average: <span className="font-medium">{classStats.classAverage}</span>
                </p>
              </div>
            </div>

            {/* Point Breakdown */}
            <div className="flex gap-4">
              <div className="bg-green-50 rounded-xl px-5 py-3 text-center">
                <p className="text-xs text-green-600 font-medium uppercase">Behaviour</p>
                <p className="text-xl font-bold text-green-700">
                  {summary.behaviourPoints > 0 ? '+' : ''}{summary.behaviourPoints || 0}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl px-5 py-3 text-center">
                <p className="text-xs text-blue-600 font-medium uppercase">Activities</p>
                <p className="text-xl font-bold text-blue-700">
                  {summary.activityPoints > 0 ? '+' : ''}{summary.activityPoints || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm text-center hover:shadow-md transition">
            <FiThumbsUp className="mx-auto text-green-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-green-600">{positiveLogs.length}</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm text-center hover:shadow-md transition">
            <FiThumbsDown className="mx-auto text-red-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-red-600">{negativeLogs.length}</p>
            <p className="text-xs text-gray-500">Negative</p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm text-center hover:shadow-md transition">
            <FiAward className="mx-auto text-blue-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            <p className="text-xs text-gray-500">Activities</p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm text-center hover:shadow-md transition">
            <FiTrendingUp className="mx-auto text-purple-500 mb-2" size={22} />
            <p className="text-2xl font-bold text-purple-600">{logs.length + activities.length}</p>
            <p className="text-xs text-gray-500">Total Records</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Behaviour Logs Tab ─── */}
        {activeTab === 'logs' && (
          logs.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border shadow-sm">
              <FiActivity className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-lg font-medium">No behaviour records yet</p>
              <p className="text-sm mt-1">Your conduct will be tracked throughout the school year.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log._id}
                  className={`bg-white rounded-xl border-l-4 p-4 shadow-sm hover:shadow-md transition ${
                    log.type === 'positive'
                      ? 'border-l-green-500'
                      : 'border-l-red-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          log.type === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.type === 'positive' ? 'Positive' : 'Negative'}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
                          {log.category?.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                          log.severity === 'serious' ? 'bg-red-100 text-red-600' :
                          log.severity === 'moderate' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {log.severity}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span>Teacher: {log.teacher?.userId?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold self-end sm:self-center ${
                      log.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {log.points > 0 ? '+' : ''}{log.points}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─── Activities Tab ─── */}
        {activeTab === 'activities' && (
          activities.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border shadow-sm">
              <FiAward className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-lg font-medium">No activities recorded yet</p>
              <p className="text-sm mt-1">Your participation in events and competitions will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map(act => (
                <div
                  key={act._id}
                  className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{act.activityName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
                          {act.category?.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full capitalize">
                          {act.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">+{act.points}</span>
                  </div>
                  {act.achievement && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3">
                      <p className="text-sm text-amber-800 flex items-center gap-1">
                        <FiStar className="w-4 h-4" /> {act.achievement}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FiCalendar className="w-3.5 h-3.5" />
                    <span>{new Date(act.eventDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─── Leaderboard Tab ─── */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <FiUsers className="text-blue-500" /> Class Leaderboard
              </h2>
              <p className="text-sm text-gray-500 mt-1">Top students by merit points</p>
            </div>
            {classStats.topStudents.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No data available.</p>
            ) : (
              <div className="divide-y">
                {classStats.topStudents.map((s, idx) => (
                  <div key={s.studentId} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400' :
                        idx === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400' :
                        idx === 2 ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-400' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <Avatar src={s.avatar} name={s.name} size="w-10 h-10" />
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">Roll No: {s.rollNumber}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">+{s.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBehaviour;