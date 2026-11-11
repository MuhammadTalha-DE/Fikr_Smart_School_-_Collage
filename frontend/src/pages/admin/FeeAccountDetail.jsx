import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiDollarSign, FiClock, FiCheck, FiPlus, FiDownload,
  FiBook, FiUser, FiCalendar
} from 'react-icons/fi';
import InstalmentTimeline from '../../components/finance/InstalmentTimeline';
import { downloadReceipt } from '../../utils/generateReceipt';

const FeeAccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '',
    instalmentId: '',
    mode: 'cash',
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: '',
    remarks: '',
  });
  const [paying, setPaying] = useState(false);

  // Concession modal state
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionForm, setConcessionForm] = useState({ amount: '', reason: '' });
  const [applyingConcession, setApplyingConcession] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, [id]);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/fee-accounts/${id}`);
      setAccount(data.account);
      // Pre‑fill payment amount with due
      setPayForm(prev => ({ ...prev, amount: data.account.dueAmount }));
    } catch (err) {
      toast.error('Failed to load fee account');
    } finally {
      setLoading(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payForm.amount || parseFloat(payForm.amount) <= 0)
      return toast.error('Enter a valid amount');
    setPaying(true);
    try {
      const { data } = await api.post(`/fee-accounts/${id}/payments/pay`, {
        amount: parseFloat(payForm.amount),
        instalmentId: payForm.instalmentId || null,
        mode: payForm.mode,
        paymentDate: payForm.paymentDate,
        reference: payForm.reference,
        remarks: payForm.remarks,
      });
      toast.success('Payment recorded');
      downloadReceipt(data.payment, account.studentId?.userId?.name);
      setShowPayModal(false);
      fetchAccount();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  // Apply Concession
  const handleApplyConcession = async (e) => {
    e.preventDefault();
    if (!concessionForm.amount || parseFloat(concessionForm.amount) <= 0)
      return toast.error('Enter a valid amount');
    setApplyingConcession(true);
    try {
      await api.post(`/fee-accounts/${id}/concessions`, {
        amount: parseFloat(concessionForm.amount),
        reason: concessionForm.reason,
      });
      toast.success('Concession applied');
      setShowConcessionModal(false);
      setConcessionForm({ amount: '', reason: '' });
      fetchAccount();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply concession');
    } finally {
      setApplyingConcession(false);
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center">Loading…</div></Layout>;
  if (!account) return <Layout role="admin"><div className="p-6 text-center text-red-500">Account not found.</div></Layout>;

  return (
    <Layout role="admin">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiDollarSign className="text-blue-600" /> Fee Account
            </h1>
            <p className="text-sm text-gray-500">
              {account.studentId?.userId?.name} | Class: {account.studentId?.classId?.name || '—'} | 
              Plan: {account.classFeePlanId?.name || '—'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <p className="text-xs text-gray-500">Total Fee</p>
            <p className="text-xl font-bold text-gray-900">PKR {account.totalAmount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border text-center">
            <p className="text-xs text-green-600">Paid</p>
            <p className="text-xl font-bold text-green-700">PKR {account.paidAmount}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border text-center">
            <p className="text-xs text-red-600">Due</p>
            <p className="text-xl font-bold text-red-700">PKR {account.dueAmount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border text-center flex flex-col justify-center">
            <p className="text-xs text-gray-500">Status</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium mx-auto mt-1 ${
              account.status === 'paid' ? 'bg-green-100 text-green-700' :
              account.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>{account.status}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPayModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus /> Record Payment
          </button>
          <button
            onClick={() => setShowConcessionModal(true)}
            className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-600"
          >
            <FiDollarSign /> Apply Concession
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left – Instalments Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiClock className="text-blue-500" /> Instalments
            </h2>
            <InstalmentTimeline instalments={account.instalments || []} />
          </div>

          {/* Right – Payment History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiDollarSign className="text-green-500" /> Payment History
            </h2>
            {account.payments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {account.payments.map(p => (
                      <tr key={p._id}>
                        <td className="px-3 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-medium">{p.amount}</td>
                        <td className="px-3 py-2">{p.mode}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            )}
          </div>

          {/* Concessions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Concessions</h2>
            {account.concessions?.length > 0 ? (
              <div className="space-y-2">
                {account.concessions.map(c => (
                  <div key={c._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">PKR {c.amount}</p>
                      <p className="text-xs text-gray-500">{c.reason || 'No reason'}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No concessions applied.</p>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Record Payment</h2>
                <button onClick={() => setShowPayModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instalment (optional)</label>
                  <select value={payForm.instalmentId} onChange={e => setPayForm({...payForm, instalmentId: e.target.value})} className="input-field">
                    <option value="">General Payment</option>
                    {account.instalments?.map(inst => (
                      <option key={inst._id} value={inst._id}>
                        #{inst.instalmentNumber} – {inst.amount} ({inst.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mode</label>
                    <select value={payForm.mode} onChange={e => setPayForm({...payForm, mode: e.target.value})} className="input-field">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Date</label>
                    <input type="date" value={payForm.paymentDate} onChange={e => setPayForm({...payForm, paymentDate: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference No.</label>
                  <input type="text" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input type="text" value={payForm.remarks} onChange={e => setPayForm({...payForm, remarks: e.target.value})} className="input-field" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={paying} className="btn-primary bg-blue-600 text-white">
                    {paying ? 'Processing…' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Concession Modal */}
        {showConcessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Apply Concession</h2>
                <button onClick={() => setShowConcessionModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleApplyConcession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input type="number" step="0.01" value={concessionForm.amount} onChange={e => setConcessionForm({...concessionForm, amount: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <input type="text" value={concessionForm.reason} onChange={e => setConcessionForm({...concessionForm, reason: e.target.value})} className="input-field" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowConcessionModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={applyingConcession} className="btn-primary bg-amber-500 text-white">
                    {applyingConcession ? 'Applying…' : 'Apply Concession'}
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

export default FeeAccountDetail;