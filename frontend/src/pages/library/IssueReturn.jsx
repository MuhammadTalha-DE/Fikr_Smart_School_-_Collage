import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import IssueForm from '../../components/library/IssueForm';
import TransactionList from '../../components/library/TransactionList';
import Avatar from '../../components/common/Avatar';

const IssueReturn = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('issued');

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter !== 'all' ? statusFilter : undefined };
      const { data } = await api.get('/library/loans', { params });
      setLoans(data.loans);
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (transactionId) => {
    if (!window.confirm('Mark this book as returned?')) return;
    try {
      await api.post('/library/return', { transactionId });
      toast.success('Book returned');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📖 Issue / Return Books</h1>
            <p className="text-sm text-gray-500 mt-1">{loans.length} transaction(s)</p>
          </div>
          <button
            onClick={() => setShowIssueForm(true)}
            className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <FiPlus /> Issue Book
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-36 bg-white"
          >
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
            <option value="all">All</option>
          </select>
          <button onClick={fetchLoans} className="btn-secondary flex items-center gap-1">
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 py-8 text-center">Loading...</p>
        ) : (
          <TransactionList loans={loans} onReturn={handleReturn} />
        )}

        {showIssueForm && (
          <IssueForm onClose={() => setShowIssueForm(false)} refresh={fetchLoans} />
        )}
      </div>
    </Layout>
  );
};

export default IssueReturn;