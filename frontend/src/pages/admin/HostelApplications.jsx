import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HostelApplications = () => {
  const [applications, setApplications] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState('');

  useEffect(() => { fetchApplications(); fetchBeds(); }, []);

  const fetchApplications = async () => {
    const { data } = await api.get('/hostel-applications');
    setApplications(data);
  };

  const fetchBeds = async () => {
    const { data } = await api.get('/hostels/beds');
    setBeds(data.filter(b => b.status === 'vacant'));
  };

  const handleApprove = async (appId) => {
    if (!selectedBed) return toast.error('Select a bed');
    try {
      await api.put(`/hostel-applications/${appId}/approve`, { bedId: selectedBed });
      toast.success('Approved');
      fetchApplications();
      fetchBeds();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (appId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/hostel-applications/${appId}/reject`, { rejectionReason: reason });
      toast.success('Rejected');
      fetchApplications();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <Layout role="admin">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Hostel Applications</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Reason</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
             {applications.filter(a => a.status === 'pending').map(app => (
  <tr key={app._id}>
    <td className="p-2 border">
      {app.studentId?.userId?.name || 'N/A'}
    </td>
    <td className="p-2 border">{app.reason}</td>
    <td className="p-2 border">{app.status}</td>
    <td className="p-2 border flex gap-2">
      <select
        onChange={e => setSelectedBed(e.target.value)}
        className="p-1 border rounded text-sm"
        defaultValue=""
      >
        <option value="" disabled>Select bed</option>
        {beds.map(bed => (
          <option key={bed._id} value={bed._id}>
            Room {bed.roomId?.roomNumber} – {bed.bedNumber}
          </option>
        ))}
      </select>
      <button onClick={() => handleApprove(app._id)} className="btn-primary text-sm">Approve</button>
      <button onClick={() => handleReject(app._id)} className="text-red-500 text-sm">Reject</button>
    </td>
  </tr>
))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default HostelApplications;