import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiPrinter, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

const PrintQueue = () => {
  const [printJobs, setPrintJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrintJobs();
    const interval = setInterval(fetchPrintJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrintJobs = async () => {
    try {
      const { data } = await api.get('/documents/print-jobs');
      setPrintJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch print jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'failed': return <FiXCircle className="text-red-500" />;
      case 'processing': return <FiRefreshCw className="text-blue-500 animate-spin" />;
      default: return <FiClock className="text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`;
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Print Queue</h1>
            <p className="text-gray-500 mt-1">Monitor document print jobs</p>
          </div>
          <button
            onClick={fetchPrintJobs}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : printJobs.length === 0 ? (
            <div className="p-12 text-center">
              <FiPrinter className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No print jobs</p>
            </div>
          ) : (
            <div className="divide-y">
              {printJobs.map(job => (
                <div key={job._id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <FiPrinter className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {job.jobType === 'bulk' ? 'Bulk Print Job' : 'Single Print Job'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {job.documentIds?.length || 0} document(s) · {job.copies || 1} copy(ies)
                          {job.colorPrint ? ' · Color' : ' · B/W'}
                          {job.duplexPrint ? ' · Duplex' : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Requested by {job.requestedBy?.name || 'Unknown'} · {new Date(job.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <span className={getStatusBadge(job.status)}>{job.status}</span>
                    </div>
                  </div>
                  {job.errorMessage && (
                    <p className="text-sm text-red-500 mt-2 ml-12">Error: {job.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrintQueue;
