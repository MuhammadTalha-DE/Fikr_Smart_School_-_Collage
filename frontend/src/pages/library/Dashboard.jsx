import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiUsers, FiAlertCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

const LibraryDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalIssued: 0,
    overdue: 0,
    recentLoans: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/library/dashboard-stats');
      setStats(data);
      console.log('Recent loans:', data.recentLoans);
if (data.recentLoans.length > 0) {
  console.log('First loan user:', data.recentLoans[0].user);
  console.log('Avatar:', data.recentLoans[0].user?.avatar);
}
    } catch (err) {
      toast.error('Could not load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 Library Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user?.name}. Here is what's happening.
            </p>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading dashboard…</div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <FiBook size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                  <p className="text-sm text-gray-500">Total Books</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                  <FiUsers size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalIssued}</p>
                  <p className="text-sm text-gray-500">Issued Books</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg text-red-600">
                  <FiAlertCircle size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                  <p className="text-sm text-gray-500">Overdue</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/library/books"
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <FiBook /> Book Inventory
              </Link>
              <Link
                to="/library/issue-return"
                className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"
              >
                <FiArrowRight /> Issue / Return
              </Link>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>
              {stats.recentLoans.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Borrower</th>
                        <th className="px-4 py-2 text-left">Book</th>
                        <th className="px-4 py-2 text-left hidden sm:table-cell">Status</th>
                        <th className="px-4 py-2 text-right">Fine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recentLoans.map((loan) => (
                        <tr key={loan._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={loan.user?.avatar}
                                name={loan.user?.name}
                                size="w-7 h-7"
                              />
                              <span className="font-medium">{loan.user?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">{loan.book?.title}</td>
                          <td className="px-4 py-2 hidden sm:table-cell">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                loan.status === 'issued'
                                  ? 'bg-blue-100 text-blue-700'
                                  : loan.status === 'returned'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {loan.fine > 0 ? `PKR ${loan.fine}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default LibraryDashboard;