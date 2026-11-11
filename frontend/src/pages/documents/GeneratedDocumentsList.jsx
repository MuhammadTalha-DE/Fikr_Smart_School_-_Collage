import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiDownload, FiSearch, FiFilter, FiTrash2, FiFileText } from 'react-icons/fi';

const GeneratedDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ documentType: '', status: '', page: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents/generated', {
        params: { ...filters, limit: 20 },
      });
      setDocuments(data?.documents || []);
      setPagination(data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId) => {
    try {
      const response = await api.get(`/documents/generated/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleRevoke = async (docId) => {
    if (!window.confirm('Revoke this document? It will no longer be valid.')) return;
    try {
      await api.delete(`/documents/generated/${docId}`);
      toast.success('Document revoked');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to revoke');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      generated: 'bg-green-100 text-green-700',
      issued: 'bg-blue-100 text-blue-700',
      revoked: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-600',
      draft: 'bg-yellow-100 text-yellow-700',
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`;
  };

  const visibleDocuments = documents.filter(doc => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [
      doc.title,
      doc.documentType,
      doc.status,
      doc.metadata?.studentName,
      doc.metadata?.className,
      doc.verificationCode,
    ].some(value => String(value || '').toLowerCase().includes(term));
  });

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Generated Documents</h1>
        <p className="text-gray-500 mb-6">View, download, and manage all generated documents</p>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg"
              />
            </div>
            <select
              value={filters.documentType}
              onChange={e => setFilters(prev => ({ ...prev, documentType: e.target.value, page: 1 }))}
              className="p-2 border rounded-lg min-w-[150px]"
            >
              <option value="">All Types</option>
              <option value="id_card">ID Card</option>
              <option value="certificate">Certificate</option>
              <option value="fee_voucher">Fee Voucher</option>
              <option value="result_card">Result Card</option>
              <option value="admit_card">Admit Card</option>
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="p-2 border rounded-lg min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="generated">Generated</option>
              <option value="issued">Issued</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
            <span className="text-sm text-gray-500">{pagination.total} total</span>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : visibleDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FiFileText className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No documents found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Title</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Generated</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Size</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleDocuments.map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium text-gray-800 truncate max-w-[200px]">
                      {doc.title || doc.documentType}
                    </td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {doc.documentType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={getStatusBadge(doc.status)}>{doc.status}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(doc._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download"
                        >
                          <FiDownload size={14} />
                        </button>
                        <button
                          onClick={() => handleRevoke(doc._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Revoke"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters(prev => ({ ...prev, page }))}
                className={`px-3 py-1.5 rounded text-sm ${
                  pagination.page === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GeneratedDocumentsList;
