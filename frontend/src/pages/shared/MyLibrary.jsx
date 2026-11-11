import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LoanCard from '../../components/library/LoanCard';
import Avatar from '../../components/common/Avatar';

const MyLibrary = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', 'fines'

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/library/my-loans');
      setLoans(data.loans);
    } catch {
      toast.error('Failed to load your loans');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (transactionId) => {
    try {
      await api.post(`/library/renew/${transactionId}`);
      toast.success('Book renewed for 7 more days');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed');
    }
  };

  const currentLoans = loans.filter(l => l.status === 'issued');
  const historyLoans = loans.filter(l => l.status !== 'issued');
  const fineLoans = loans.filter(l => l.fine > 0);

  const displayedLoans =
    activeTab === 'current' ? currentLoans :
    activeTab === 'history' ? historyLoans :
    fineLoans;

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📚 My Library</h1>
        <div className="flex items-center gap-4 mb-6">
  <Avatar src={user?.avatar} name={user?.name} size="w-12 h-12" />
  <div>
    <p className="font-bold text-lg text-gray-900">{user?.name}</p>
    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
  </div>
</div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b pb-2">
          {['current', 'history', 'fines'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'current' && `Current (${currentLoans.length})`}
              {tab === 'history' && `History (${historyLoans.length})`}
              {tab === 'fines' && `Fines (${fineLoans.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading your loans…</p>
        ) : displayedLoans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No books to show.</p>
        ) : (
          <div className="space-y-4">
            {displayedLoans.map(loan => (
              <LoanCard key={loan._id} loan={loan} onRenew={handleRenew} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyLibrary;