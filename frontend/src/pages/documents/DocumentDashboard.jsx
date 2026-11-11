import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import {
  FiFileText, FiGrid, FiDownload, FiClock, FiTrendingUp,
  FiShield, FiPrinter, FiAlertCircle, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DocumentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/documents/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Templates',
      value: dashboardData?.totalTemplates || 0,
      icon: FiGrid,
      color: 'bg-blue-500',
      link: '/admin/documents/templates',
    },
    {
      label: 'Active Templates',
      value: dashboardData?.activeTemplates || 0,
      icon: FiCheckCircle,
      color: 'bg-green-500',
      link: '/admin/documents/templates',
    },
    {
      label: 'Documents Generated',
      value: dashboardData?.totalGenerated || 0,
      icon: FiDownload,
      color: 'bg-purple-500',
      link: '/admin/documents/generated',
    },
    {
      label: 'Pending Requests',
      value: dashboardData?.pendingRequests || 0,
      icon: FiClock,
      color: 'bg-orange-500',
      link: '/admin/documents/requests',
    },
  ];

  const quickActions = [
    { label: 'ID Card Generator', path: '/admin/documents/id-card', icon: FiFileText, color: 'text-blue-600' },
    { label: 'Certificate Generator', path: '/admin/documents/certificates', icon: FiFileText, color: 'text-green-600' },
    { label: 'Fee Voucher', path: '/admin/documents/fee-voucher', icon: FiFileText, color: 'text-purple-600' },
    { label: 'Result Card', path: '/admin/documents/result-card', icon: FiFileText, color: 'text-orange-600' },
    { label: 'Admit Card', path: '/admin/documents/admit-card', icon: FiFileText, color: 'text-red-600' },
    { label: 'Bulk Generation', path: '/admin/documents/bulk', icon: FiDownload, color: 'text-indigo-600' },
    { label: 'Template Builder', path: '/admin/documents/templates', icon: FiGrid, color: 'text-teal-600' },
    { label: 'Print Queue', path: '/admin/documents/print', icon: FiPrinter, color: 'text-pink-600' },
  ];

  const documentTypes = [
    { type: 'id_card', label: 'ID Card', count: 0 },
    { type: 'certificate', label: 'Certificate', count: 0 },
    { type: 'fee_voucher', label: 'Fee Voucher', count: 0 },
    { type: 'result_card', label: 'Result Card', count: 0 },
    { type: 'admit_card', label: 'Admit Card', count: 0 },
    { type: 'official_letter', label: 'Official Letter', count: 0 },
  ];

  if (dashboardData?.statsByType) {
    dashboardData.statsByType.forEach(s => {
      const found = documentTypes.find(d => d.type === s._id);
      if (found) found.count = s.count;
    });
  }

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Document Center</h1>
            <p className="text-gray-500 mt-1">Smart Document & Certificate Generation System</p>
          </div>
          <Link
            to="/admin/documents/templates"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiGrid /> Template Builder
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.link} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {loading ? (
                      <span className="animate-pulse bg-gray-200 inline-block w-12 h-8 rounded" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="text-white text-xl" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group"
                >
                  <action.icon className={`text-2xl ${action.color} mb-2 group-hover:scale-110 transition`} />
                  <span className="text-xs text-gray-600 text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Documents</h2>
            <div className="space-y-3">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : dashboardData?.recentDocuments?.length > 0 ? (
                dashboardData.recentDocuments.map((doc, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      doc.status === 'generated' ? 'bg-green-100 text-green-600' :
                      doc.status === 'issued' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <FiFileText className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.title || doc.documentType}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN')} · {doc.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No recent documents</p>
              )}
            </div>
          </div>
        </div>

        {/* Document Type Chart & Pending Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Documents by Type</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                      <div className="h-2 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : dashboardData?.recentRequests?.length > 0 ? (
                dashboardData.recentRequests.map((req, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <FiClock className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {req.documentType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-400">
                        by {req.requestedBy?.name || 'Unknown'} · {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Link
                      to="/admin/documents/requests"
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="text-3xl text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DocumentDashboard;
