import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX } from 'react-icons/fi';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/hostel-leaves');
      setLeaves(data);
    } catch { toast.error('Failed to load leaves'); }
  };

  const handleAction = async (id, action, rejectionReason = '') => {
    try {
      await api.put(`/hostel-leaves/${id}/${action}`, { rejectionReason });
      toast.success(`Leave ${action}ed`);
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Layout role="warden">
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Leave Management</h1>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Reason</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l._id} className="border-t">
                  <td className="p-2">{l.hostelStudentId?.studentId?.userId?.name || 'N/A'}</td>
                  <td className="p-2 capitalize">{l.leaveType}</td>
                  <td className="p-2">{new Date(l.fromDate).toLocaleDateString()}</td>
                  <td className="p-2">{new Date(l.toDate).toLocaleDateString()}</td>
                  <td className="p-2">{l.reason || '—'}</td>
                  <td className="p-2">{l.status}</td>
                  <td className="p-2 flex gap-2">
                    {l.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(l._id, 'approve')} className="text-green-600 hover:text-green-800"><FiCheck /></button>
                        <button onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          handleAction(l._id, 'reject', reason || '');
                        }} className="text-red-600 hover:text-red-800"><FiX /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-500">No leave requests.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default LeaveManagement;