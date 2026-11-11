import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import { downloadReceipt } from '../../utils/generateReceipt';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiEye, FiPlus, FiRefreshCw, FiFilter, FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { validateForm, getFirstValidationError } from '../../utils/validation';
import { paymentSchema } from '../../utils/validationSchemas';

const StudentFeeAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useDropdownData('/classes');

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    instalmentId: '',
    mode: 'cash',
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: '',
    remarks: '',
  });
  const [paying, setPaying] = useState(false);

  useEffect(() => { fetchAccounts(); }, [classFilter]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = classFilter ? { class: classFilter } : {};
      const { data } = await api.get('/fee-accounts', { params });
      setAccounts(data.accounts || data);
    } catch { toast.error('Failed to load fee accounts'); }
    finally { setLoading(false); }
  };

  const openPayModal = (account) => {
    setSelectedAccount(account);
    // Pre‑fill amount with current due
    setPayForm({
      amount: account.dueAmount,
      instalmentId: '',
      mode: 'cash',
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: '',
      remarks: '',
    });
    setShowPayModal(true);
  };

const handleRecordPayment = async (e) => {
  e.preventDefault();
  const validation = validateForm(paymentSchema, payForm);
  if (!validation.isValid) {
    return toast.error(getFirstValidationError(validation.errors));
  }

  setPaying(true);
  try {
    const { data } = await api.post(`/fee-accounts/${selectedAccount._id}/payments/pay`, {
      amount: parseFloat(payForm.amount),
      instalmentId: payForm.instalmentId || null,
      mode: payForm.mode,
      paymentDate: payForm.paymentDate,
      reference: payForm.reference,
      remarks: payForm.remarks,
    });
    toast.success('Payment recorded');
    downloadReceipt(data.payment, selectedAccount.studentId?.userId?.name); // if you added receipt generation
    setShowPayModal(false);
    fetchAccounts();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Payment failed');
  } finally { setPaying(false); }
};

  
  const handleApplyLateFees = async () => {
  if (!window.confirm('Apply late fees to all overdue instalments?')) return;
  try {
    await api.post('/fee-accounts/apply-late-fees', { lateFeeAmount: 50 });
    toast.success('Late fees applied');
    fetchAccounts();
  } catch (err) {
    toast.error('Failed to apply late fees');
  }
};

  // Helper: status badge
  const getStatusBadge = (status) => {
    const colors = {
      unpaid: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status] || ''}`;
  };

  return (
    <Layout role="admin">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <FiDollarSign className="inline mr-2 text-blue-600" /> Student Fee Accounts
          </h1>
          <button onClick={fetchAccounts} className="btn-secondary flex items-center gap-1">
            <FiRefreshCw /> Refresh
          </button>
          // In the header:
<button onClick={handleApplyLateFees} className="btn-secondary text-red-600">
  Apply Late Fees
</button>
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-4 mb-6">
          <FiFilter className="text-gray-500" />
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="input-field w-48 bg-white">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Accounts Card Grid */}
        {loading ? <p className="text-gray-500 py-8 text-center">Loading…</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">No fee accounts found.</div>
            )}
            {accounts.map(acc => (
              <div key={acc._id} className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {acc.studentId?.userId?.name || 'Student'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Class: {acc.studentId?.classId?.name || '—'} | Plan: {acc.classFeePlanId?.name || '—'}
                    </p>
                  </div>
                  <span className={getStatusBadge(acc.status)}>{acc.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold">{acc.totalAmount}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-bold">{acc.paidAmount}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Due</p>
                    <p className="font-bold">{acc.dueAmount}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Link to={`/admin/fee-accounts/${acc._id}`} className="text-blue-600 text-sm hover:underline">
                    <FiEye className="inline mr-1" /> Details
                  </Link>
                  <button
                    onClick={() => openPayModal(acc)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <FiPlus /> Record Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Record Payment Modal */}
        {showPayModal && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Record Payment</h2>
                <button onClick={() => setShowPayModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Student: <strong>{selectedAccount.studentId?.userId?.name}</strong> | 
                Due: <strong>{selectedAccount.dueAmount}</strong>
              </p>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payForm.amount}
                    onChange={e => setPayForm({...payForm, amount: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Instalment (optional)</label>
                  <select
                    value={payForm.instalmentId}
                    onChange={e => setPayForm({...payForm, instalmentId: e.target.value})}
                    className="input-field"
                  >
                    <option value="">General Payment</option>
                    {selectedAccount.instalments?.map(inst => (
                      <option key={inst._id} value={inst._id}>
                        #{inst.instalmentNumber} – {inst.amount} (Due: {new Date(inst.dueDate).toLocaleDateString()}) [{inst.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mode</label>
                    <select
                      value={payForm.mode}
                      onChange={e => setPayForm({...payForm, mode: e.target.value})}
                      className="input-field"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={payForm.paymentDate}
                      onChange={e => setPayForm({...payForm, paymentDate: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reference No.</label>
                  <input
                    type="text"
                    value={payForm.reference}
                    onChange={e => setPayForm({...payForm, reference: e.target.value})}
                    placeholder="Cheque / Transaction ID"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={payForm.remarks}
                    onChange={e => setPayForm({...payForm, remarks: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={paying} className="btn-primary bg-blue-600 text-white">
                    {paying ? 'Processing…' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentFeeAccounts;
