import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiHome, FiBook, FiClock, FiRefreshCw, FiCreditCard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import InstalmentTimeline from '../../components/finance/InstalmentTimeline';
import { validateForm, getFirstValidationError } from '../../utils/validation';
import { paymentAmountSchema } from '../../utils/validationSchemas';

const ProgressRing = ({ paid, total }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="url(#progressGradient)"
          strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
        {Math.round(percent)}%
      </div>
    </div>
  );
};

const FeeAccountCard = ({ account, onPayInstalment, onGeneralPayment }) => {
  const [payAmount, setPayAmount] = useState('');
  const [payingInstalment, setPayingInstalment] = useState(null);

  const handlePay = async (instalmentId, amount) => {
    if (instalmentId) {
      const validation = validateForm(paymentAmountSchema, { amount });
      if (!validation.isValid) return toast.error(getFirstValidationError(validation.errors));
      if (!window.confirm(`Pay PKR ${amount.toLocaleString()} for this instalment?`)) return;
      setPayingInstalment(instalmentId);
      await onPayInstalment(account._id, instalmentId, amount);
      setPayingInstalment(null);
    } else {
      const validation = validateForm(paymentAmountSchema, { amount: payAmount });
      if (!validation.isValid) return toast.error(getFirstValidationError(validation.errors));
      if (!window.confirm(`Pay PKR ${parseFloat(payAmount).toLocaleString()}?`)) return;
      await onGeneralPayment(account._id, parseFloat(payAmount));
      setPayAmount('');
    }
  };

  const nextDue = account.instalments?.find(i => i.status === 'unpaid');
  const isHostel = !!account.hostelId;
  const percentPaid = account.totalAmount > 0 ? Math.round((account.paidAmount / account.totalAmount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${
        isHostel ? 'border-yellow-200 hover:border-yellow-300' : 'border-blue-200 hover:border-blue-300'
      }`}
    >
      {/* Top Bar */}
      <div className={`px-6 py-3 rounded-t-2xl flex items-center justify-between ${
        isHostel ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isHostel ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
            {isHostel ? <FiHome className="w-4 h-4" /> : <FiBook className="w-4 h-4" />}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {isHostel ? account.hostelId?.name : account.classId?.name || 'Tuition Fee'}
          </span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          percentPaid === 100 ? 'bg-green-100 text-green-700' :
          percentPaid > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
        }`}>
          {percentPaid === 100 ? <FiCheckCircle className="inline mr-1 w-3 h-3" /> : <FiAlertCircle className="inline mr-1 w-3 h-3" />}
          {percentPaid === 100 ? 'Paid' : `${percentPaid}% Paid`}
        </span>
      </div>

      <div className="p-6">
        {/* Progress + Summary */}
        <div className="flex items-center gap-4 mb-5">
          <ProgressRing paid={account.paidAmount} total={account.totalAmount} />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Fee</span>
              <span className="font-bold text-gray-800">PKR {account.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Paid</span>
              <span className="font-bold text-green-600">PKR {account.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500">Due</span>
              <span className="font-bold text-red-500">PKR {account.dueAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Instalments */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <FiClock className="w-4 h-4 text-indigo-500" /> Instalments
          </h4>
          <InstalmentTimeline
            instalments={account.instalments?.map(inst => ({
              ...inst,
              onPay: () => handlePay(inst._id, inst.amount),
              paying: payingInstalment === inst._id,
            })) || []}
            showPayButton={true}
          />
        </div>

        {/* Quick Payment */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <FiCreditCard className="w-3 h-3" /> Quick Custom Payment
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              placeholder={`PKR ${nextDue?.amount?.toLocaleString() || 'Any amount'}`}
            />
            <button
              onClick={() => handlePay(null)}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
            >
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeePortal = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fee-accounts/my');
      setAccounts(data.accounts || []);
    } catch (err) {
      toast.error('Could not load fee accounts');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstalment = async (accountId, instalmentId, amount) => {
    const validation = validateForm(paymentAmountSchema, { amount });
    if (!validation.isValid) return toast.error(getFirstValidationError(validation.errors));

    try {
      await api.post(`/fee-accounts/${accountId}/payments`, { amount, instalmentId, mode: 'online' });
      toast.success('Payment successful!');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleGeneralPayment = async (accountId, amount) => {
    const validation = validateForm(paymentAmountSchema, { amount });
    if (!validation.isValid) return toast.error(getFirstValidationError(validation.errors));

    try {
      await api.post(`/fee-accounts/${accountId}/payments`, { amount, instalmentId: null, mode: 'online' });
      toast.success('Payment recorded!');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const tuitionAccounts = accounts.filter(a => !a.hostelId);
  const hostelAccounts = accounts.filter(a => a.hostelId);

  return (
    <Layout role={user?.role || 'student'}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="p-3.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/20">
              <FiDollarSign className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-900">Fee Portal</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your tuition and hostel payments</p>
            </div>
            <button
              onClick={fetchAccounts}
              className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Refresh"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse space-y-4 border border-gray-100">
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-24 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && accounts.length === 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-600">No Fee Accounts Found</p>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                If you recently joined a hostel or enrolled in a new class, please wait or contact the administration.
              </p>
            </motion.div>
          )}

          {/* Tuition Fees */}
          {!loading && tuitionAccounts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiBook className="text-blue-600 w-5 h-5" /> Tuition Fees
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {tuitionAccounts.map(acc => (
                  <FeeAccountCard
                    key={acc._id}
                    account={acc}
                    onPayInstalment={handlePayInstalment}
                    onGeneralPayment={handleGeneralPayment}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Hostel Fees */}
          {!loading && hostelAccounts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiHome className="text-yellow-600 w-5 h-5" /> Hostel Fees
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {hostelAccounts.map(acc => (
                  <FeeAccountCard
                    key={acc._id}
                    account={acc}
                    onPayInstalment={handlePayInstalment}
                    onGeneralPayment={handleGeneralPayment}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FeePortal;
