import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { FiMessageSquare, FiUsers, FiBarChart2, FiTrendingUp, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const ChatAnalytics = () => {
  const [usage, setUsage] = useState({ totalConversations: 0, totalMessages: 0, activeUsers: 0 });
  const [tools, setTools] = useState([]);
  const [trends, setTrends] = useState([]);
  const [feedback, setFeedback] = useState({ up: 0, down: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [usageRes, toolsRes, trendsRes, feedbackRes] = await Promise.all([
        api.get('/chat-analytics/usage'),
        api.get('/chat-analytics/tools'),
        api.get('/chat-analytics/trends'),
        api.get('/chat-analytics/feedback'),
      ]);
      setUsage(usageRes.data);
      setTools(toolsRes.data);
      setTrends(trendsRes.data);
      setFeedback(feedbackRes.data);
    };
    fetchData();
  }, []);

  const toolChartData = {
    labels: tools.map(t => t.tool.replace('get_my_', '')),
    datasets: [{ label: 'Uses', data: tools.map(t => t.count), backgroundColor: '#6366f1' }],
  };

  const trendChartData = {
    labels: trends.map(t => t.date.slice(5)),
    datasets: [{
      label: 'Conversations',
      data: trends.map(t => t.count),
      fill: true,
      backgroundColor: 'rgba(99,102,241,0.2)',
      borderColor: '#6366f1',
      tension: 0.3,
    }],
  };

  const feedbackPieData = {
    labels: ['👍 Helpful', '👎 Not Helpful'],
    datasets: [{ data: [feedback.up, feedback.down], backgroundColor: ['#10b981', '#ef4444'] }],
  };

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-mesh-light dark:bg-mesh-dark p-4 md:p-6">
        <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-extrabold text-gradient mb-8">
          📊 Chatbot Analytics
        </motion.h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-indigo-400 text-2xl" />
              <div>
                <p className="text-lg font-bold"><CountUp end={usage.totalConversations} /></p>
                <p className="text-xs text-slate-400">Total Conversations</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <FiUsers className="text-emerald-400 text-2xl" />
              <div>
                <p className="text-lg font-bold"><CountUp end={usage.activeUsers} /></p>
                <p className="text-xs text-slate-400">Active Users</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <FiBarChart2 className="text-amber-400 text-2xl" />
              <div>
                <p className="text-lg font-bold"><CountUp end={usage.totalMessages} /></p>
                <p className="text-xs text-slate-400">Total Messages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Popular Tools</h3>
            <Bar data={toolChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Conversation Trends</h3>
            <Line data={trendChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Feedback</h3>
            <Pie data={feedbackPieData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatAnalytics;