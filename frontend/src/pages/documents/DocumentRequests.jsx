import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiClock, FiCheckCircle, FiXCircle, FiEye, FiFilter } from 'react-icons/fi';

const DocumentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents/requests', {
        params: { status: filter, limit: 50 },
      });
      setRequests(data?.requests || []);
    } catch (err) {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/documents/requests/${id}/approve`);
      toast.success('Request approved! Document generated.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/documents/requests/${id}/reject`, { rejectionReason: reason });
      toast.success('Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      generated: 'bg-green-100 text-green-700',
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-600',
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${styles[priority] || 'bg-gray-100'}`;
  };

  return (
    <Layout role="admin">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Document Requests</h1>
            <p className="text-gray-500 mt-1">Manage and process document requests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <FiFilter className="text-gray-400" />
          {['pending', 'approved', 'rejected', 'generated', ''].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <FiClock className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No {filter || ''} requests found</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map(req => (
                <div key={req._id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {req.documentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={getStatusBadge(req.status)}>{req.status}</span>
                        <span className={getPriorityBadge(req.priority)}>{req.priority}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Requested by: <span className="font-medium">{req.requestedBy?.name || 'Unknown'}</span>
                      </p>
                      {req.reason && (
                        <p className="text-sm text-gray-500 mt-1">Reason: {req.reason}</p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-sm text-red-500 mt-1">Rejected: {req.rejectionReason}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition flex items-center gap-1"
                        >
                          <FiCheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-1"
                        >
                          <FiXCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DocumentRequests;
