import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiDownload, FiSearch, FiUser, FiFileText, FiShield,
  FiCheckCircle, FiRefreshCw,
} from 'react-icons/fi';
import { downloadBase64Pdf, downloadBlob, filterStudents, formatStudentOption, formatTeacherOption } from '../../utils/documentUtils';

const IDCardGenerator = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentCards, setRecentCards] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchTemplates();
    fetchRecentCards();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students');
      const sorted = (data || []).sort((a, b) =>
        (a.userId?.name || '').localeCompare(b.userId?.name || '')
      );
      setStudents(sorted);
    } catch (err) {
      console.error('Failed to load students');
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data || []);
    } catch (err) {
      console.error('Failed to load teachers');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/documents/templates', {
        params: { type: 'id_card', isActive: true },
      });
      setTemplates(data || []);
    } catch (err) {
      // Templates might not exist yet
    }
  };

  const fetchRecentCards = async () => {
    try {
      const { data } = await api.get('/documents/generated', {
        params: { documentType: 'id_card', limit: 5 },
      });
      setRecentCards(data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch recent cards');
    }
  };

  const filteredStudents = filterStudents(students, searchTerm);

  const filteredTeachers = teachers.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (t.userId?.name || '').toLowerCase();
    const empId = (t.employeeId || '').toLowerCase();
    return name.includes(term) || empId.includes(term);
  });

  const handleGenerate = async () => {
    if (!selectedId) return toast.error(`Please select a ${activeTab}`);
    
    const templateId = selectedTemplate || (templates.length > 0 ? templates[0]._id : null);
    
    setLoading(true);
    try {
      const { data } = await api.post('/documents/generate', {
        templateId: templateId,
        ownerType: activeTab,
        ownerId: selectedId,
        documentType: 'id_card',
      });

      downloadBase64Pdf(data.pdfBuffer, `ID_Card_${data.metadata?.studentName || activeTab}.pdf`);

      toast.success('ID Card generated successfully!');
      fetchRecentCards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDownload = async (docId) => {
    try {
      const response = await api.get(`/documents/generated/${docId}/download`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, 'ID_Card.pdf');
      toast.success('Downloaded');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ID Card Generator</h1>
            <p className="text-gray-500 mt-1">Generate and download ID cards for students and staff</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => { setActiveTab('student'); setSelectedId(''); }}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${
              activeTab === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiUser className="inline mr-1" /> Student ID
          </button>
          <button
            onClick={() => { setActiveTab('teacher'); setSelectedId(''); }}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${
              activeTab === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiUser className="inline mr-1" /> Teacher / Staff ID
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Generate {activeTab === 'student' ? 'Student' : 'Teacher/Staff'} ID Card
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'student' ? 'student by name, roll, or admission...' : 'teacher by name or employee ID...'}`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {activeTab === 'student' ? 'Student' : 'Teacher'}
                </label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  size={6}
                >
                  <option value="">-- Select --</option>
                  {(activeTab === 'student' ? filteredStudents : filteredTeachers).map(item => (
                    <option key={item._id} value={item._id}>
                      {activeTab === 'student' ? formatStudentOption(item) : formatTeacherOption(item)}
                    </option>
                  ))}
                </select>
                {(activeTab === 'student' ? filteredStudents : filteredTeachers).length === 0 && searchTerm && (
                  <p className="text-sm text-red-500 mt-1">No results found</p>
                )}
              </div>

              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Card Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                >
                  {templates.length === 0 && (
                    <option value="">Default Template (built-in)</option>
                  )}
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedId}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                  loading || !selectedId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <><FiRefreshCw className="animate-spin" /> Generating...</>
                ) : (
                  <><FiDownload /> Generate & Download PDF</>
                )}
              </button>
            </div>
          </div>

          {/* Recent Cards & Info */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiShield className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">QR Verified</h3>
                  <p className="text-xs text-gray-400">All cards have QR verification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCheckCircle className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Auto Data Fill</h3>
                  <p className="text-xs text-gray-400">Data pulled from student/teacher profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiFileText className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Professional Design</h3>
                  <p className="text-xs text-gray-400">With school logo, signature & stamp</p>
                </div>
              </div>
            </div>

            {/* Recent ID Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-3">Recently Generated</h3>
              {recentCards.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No cards generated yet</p>
              ) : (
                <div className="space-y-2">
                  {recentCards.map(card => (
                    <div key={card._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {card.title || 'ID Card'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(card.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickDownload(card._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
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

export default IDCardGenerator;
