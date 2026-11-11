import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiDownload, FiSearch, FiDollarSign, FiFileText } from 'react-icons/fi';
import { downloadBase64Pdf, downloadBlob, filterStudents, formatStudentOption } from '../../utils/documentUtils';

const FeeVoucherGenerator = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedType, setSelectedType] = useState('fee_voucher');
  const [loading, setLoading] = useState(false);
  const [recentDocs, setRecentDocs] = useState([]);

  const docTypes = [
    { value: 'fee_voucher', label: 'Fee Voucher' },
    { value: 'receipt', label: 'Fee Receipt' },
    { value: 'fee_clearance', label: 'Fee Clearance Certificate' },
    { value: 'outstanding_notice', label: 'Outstanding Fee Notice' },
    { value: 'installment_plan', label: 'Installment Plan Letter' },
    { value: 'scholarship', label: 'Scholarship Approval Letter' },
    { value: 'late_fee_notice', label: 'Late Fee Notice' },
    { value: 'monthly_fee_statement', label: 'Monthly Fee Statement' },
    { value: 'annual_fee_statement', label: 'Annual Fee Statement' },
  ];

  useEffect(() => {
    fetchStudents();
    fetchRecent();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setStudents((data || []).sort((a, b) => (a.userId?.name || '').localeCompare(b.userId?.name || '')));
    } catch (err) { console.error(err); }
  };

  const fetchRecent = async () => {
    try {
      const { data } = await api.get('/documents/generated', {
        params: { documentType: 'fee_voucher', limit: 5 },
      });
      setRecentDocs(data?.documents || []);
    } catch (err) {}
  };

  const filteredStudents = filterStudents(students, searchTerm);

  const handleGenerate = async () => {
    if (!selectedStudent) return toast.error('Select a student');
    setLoading(true);
    try {
      const { data } = await api.post('/documents/generate', {
        templateId: null,
        ownerType: 'student',
        ownerId: selectedStudent,
        documentType: selectedType,
      });

      downloadBase64Pdf(data.pdfBuffer, `${selectedType}_${data.metadata?.studentName || 'student'}.pdf`);
      toast.success('Document generated!');
      fetchRecent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDownload = async (docId) => {
    try {
      const response = await api.get(`/documents/generated/${docId}/download`, { responseType: 'blob' });
      downloadBlob(response.data, 'document.pdf');
      toast.success('Downloaded');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Fee Documents</h1>
          <p className="text-gray-500 mt-1">Generate vouchers, receipts, statements and notices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Document Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                <FiFileText className="inline mr-2 text-purple-600" />
                Document Type
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                {docTypes.map(dt => (
                  <button
                    key={dt.value}
                    onClick={() => setSelectedType(dt.value)}
                    className={`p-3 rounded-lg border text-sm text-left transition ${
                      selectedType === dt.value
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FiDollarSign className={`inline mr-1 ${selectedType === dt.value ? 'text-purple-600' : 'text-gray-400'}`} />
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Student</h2>
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2.5 border rounded-lg"
                />
              </div>
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
                size={5}
              >
                <option value="">-- Select --</option>
                {filteredStudents.map(s => (
                  <option key={s._id} value={s._id}>
                    {formatStudentOption(s)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedStudent}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                loading || !selectedStudent
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {loading ? 'Generating...' : <><FiDownload /> Generate Document</>}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <FiDollarSign className="text-3xl mb-2" />
              <h3 className="font-semibold text-lg">Fee Documents</h3>
              <p className="text-sm opacity-90 mt-1">Generate fee-related documents with auto-calculated amounts</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-3">Recent Documents</h3>
              {recentDocs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">None yet</p>
              ) : (
                <div className="space-y-2">
                  {recentDocs.map(doc => (
                    <div key={doc._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.title || 'Document'}</p>
                        <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleQuickDownload(doc._id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded">
                        <FiDownload size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FeeVoucherGenerator;
