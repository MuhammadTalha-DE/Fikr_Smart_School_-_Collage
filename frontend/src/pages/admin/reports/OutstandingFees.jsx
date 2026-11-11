import { useState, useEffect } from 'react';
import Layout from '../../../components/common/Layout';
import api from '../../../services/api';
import { useDropdownData } from '../../../hooks/useDropdownData';
import { FiFilter, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OutstandingFees = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useDropdownData('/classes');

  useEffect(() => {
    fetchOutstanding();
  }, [classFilter]);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const params = classFilter ? { class: classFilter } : {};
      const { data } = await api.get('/fee-accounts', { params });
      // show only those with dueAmount > 0
      setAccounts(data.accounts.filter(a => a.dueAmount > 0));
    } catch {
      toast.error('Failed to load outstanding fees');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = accounts.map(a => [
      a.studentId?.userId?.name,
      a.studentId?.classId?.name,
      a.totalAmount,
      a.paidAmount,
      a.dueAmount,
    ]);
    const csv = [['Name', 'Class', 'Total', 'Paid', 'Due'], ...rows]
      .map(r => r.map(c => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'outstanding_fees.csv';
    a.click();
  };

  return (
    <Layout role="admin">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Outstanding Fees</h1>
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-1"
          >
            <FiDownload /> CSV
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <FiFilter className="text-gray-500" />
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="input-field w-48 bg-white"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 py-8 text-center">Loading…</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No outstanding fees found.
                    </td>
                  </tr>
                ) : (
                  accounts.map(a => (
                    <tr key={a._id}>
                      <td className="px-4 py-2">{a.studentId?.userId?.name}</td>
                      <td className="px-4 py-2">{a.studentId?.classId?.name}</td>
                      <td className="px-4 py-2">{a.totalAmount}</td>
                      <td className="px-4 py-2">{a.paidAmount}</td>
                      <td className="px-4 py-2 text-red-600 font-bold">{a.dueAmount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OutstandingFees;