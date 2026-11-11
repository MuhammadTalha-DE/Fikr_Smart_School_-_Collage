import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiDownload, FiSearch, FiFileText, FiClock, FiCheckCircle,
  FiAward, FiStar, FiRefreshCw, FiGlobe, FiClipboard, FiDollarSign,
  FiHome, FiBriefcase, FiUser, FiCalendar, FiAlertCircle,
} from 'react-icons/fi';
import {
  downloadBase64Pdf,
  downloadBlob,
  filterStudents,
  formatStudentOption,
  formatTeacherOption,
} from '../../utils/documentUtils';

const CERTIFICATE_TYPES = [
  { value: 'bonafide', label: 'Bonafide Certificate', icon: FiAward },
  { value: 'character', label: 'Character Certificate', icon: FiStar },
  { value: 'leaving', label: 'Leaving Certificate', icon: FiFileText },
  { value: 'transfer', label: 'Transfer Certificate', icon: FiRefreshCw },
  { value: 'migration', label: 'Migration Certificate', icon: FiGlobe },
  { value: 'attendance_certificate', label: 'Attendance Certificate', icon: FiClipboard },
  { value: 'fee_clearance', label: 'Fee Clearance Certificate', icon: FiDollarSign },
  { value: 'hostel_certificate', label: 'Hostel Certificate', icon: FiHome },
  { value: 'scholarship', label: 'Scholarship Letter', icon: FiAward },
  { value: 'sports', label: 'Sports Participation', icon: FiStar },
  { value: 'achievement', label: 'Achievement Certificate', icon: FiAward },
  { value: 'experience', label: 'Experience Certificate', icon: FiBriefcase },
  { value: 'no_objection', label: 'No Objection Certificate', icon: FiCheckCircle },
];

const todayInputValue = () => new Date().toISOString().split('T')[0];

const currentAcademicSession = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const CertificateGenerator = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientType, setRecipientType] = useState('student');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedType, setSelectedType] = useState('bonafide');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [issueDate, setIssueDate] = useState(todayInputValue());
  const [academicSession, setAcademicSession] = useState(currentAcademicSession());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentCertificates, setRecentCertificates] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchTemplates();
    fetchRecentCertificates();
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
      const sorted = (data || []).sort((a, b) =>
        (a.userId?.name || '').localeCompare(b.userId?.name || '')
      );
      setTeachers(sorted);
    } catch (err) {
      console.error('Failed to load teachers');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/documents/templates', {
        params: { isActive: true },
      });
      setTemplates(data || []);
    } catch (err) {
      // Templates might not exist
    }
  };

  const fetchRecentCertificates = async () => {
    try {
      const { data } = await api.get('/documents/generated', {
        params: { limit: 20 },
      });
      const certificateTypeValues = new Set(CERTIFICATE_TYPES.map(type => type.value));
      setRecentCertificates((data?.documents || [])
        .filter(doc => certificateTypeValues.has(doc.documentType) || doc.documentType === 'certificate')
        .slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch recent certificates');
    }
  };

  const filteredStudents = filterStudents(students, searchTerm);
  const filteredTeachers = teachers.filter((teacher) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return [
      teacher?.userId?.name,
      teacher?.userId?.email,
      teacher?.employeeId,
      ...(teacher?.subjects || []),
    ].some(value => String(value || '').toLowerCase().includes(term));
  });

  const matchingTemplates = templates.filter((template) => {
    const typeMatches = template.type === selectedType || template.type === 'certificate';
    const roleMatches = recipientType === 'teacher'
      ? ['teacher', 'staff'].includes(template.roleTarget)
      : template.roleTarget === recipientType;

    return typeMatches && roleMatches;
  });
  const selectedTypeMeta = CERTIFICATE_TYPES.find(t => t.value === selectedType);
  const selectedOwnerId = recipientType === 'student' ? selectedStudent : selectedTeacher;
  const selectedTemplateData = templates.find(template => template._id === selectedTemplate);
  const customInputFields = (selectedTemplateData?.fields || []).filter(field => field.customInput && field.key);

  const getValidationErrors = () => {
    const errors = [];

    if (!selectedType) errors.push('Select a certificate type.');
    if (!selectedOwnerId) errors.push(`Select a ${recipientType}.`);
    if (!academicSession.trim()) errors.push('Enter the academic session.');
    if (!issueDate) errors.push('Select the issue date.');
    if (!selectedTemplate) errors.push('Select an active certificate template.');
    customInputFields.forEach((field) => {
      if (field.required && !String(customValues[field.key] ?? field.defaultValue ?? '').trim()) {
        errors.push(`${field.label || field.key} is required.`);
      }
    });
    return errors;
  };

  const validationErrors = getValidationErrors();

  const handleGenerate = async () => {
    if (validationErrors.length) {
      toast.error(validationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/documents/generate', {
        templateId: selectedTemplate,
        ownerType: recipientType,
        ownerId: selectedOwnerId,
        documentType: selectedType,
        issueDate,
        academicSession: academicSession.trim(),
        reason: reason.trim() || 'Official school purpose',
        customFields: Object.fromEntries(customInputFields.map(field => [
          field.key,
          customValues[field.key] ?? field.defaultValue ?? '',
        ])),
        additionalData: {
          issueDate,
          academicSession: academicSession.trim(),
        },
      });

      const certType = CERTIFICATE_TYPES.find(t => t.value === selectedType)?.label || 'Certificate';
      downloadBase64Pdf(data.pdfBuffer, `${certType}_${data.metadata?.studentName || recipientType}.pdf`);

      toast.success('Certificate generated successfully!');
      setReason('');
      fetchRecentCertificates();
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
      downloadBlob(response.data, 'Certificate.pdf');
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
            <h1 className="text-3xl font-bold text-gray-800">Certificate Generator</h1>
            <p className="text-gray-500 mt-1">Generate various certificates for students</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Student */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                <FiSearch className="inline mr-2 text-blue-600" />
                Select Recipient
              </h2>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { value: 'student', label: 'Student' },
                  { value: 'teacher', label: 'Teacher' },
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setRecipientType(type.value);
                      setSearchTerm('');
                      setSelectedTemplate('');
                    }}
                    className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                      recipientType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiUser /> {type.label}
                  </button>
                ))}
              </div>

              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={recipientType === 'student'
                    ? 'Search by name, roll number, or admission number...'
                    : 'Search by teacher name, email, employee ID, or subject...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {recipientType === 'student' ? (
                <>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    size={5}
                  >
                    <option value="">-- Select Student --</option>
                    {filteredStudents.map(s => (
                      <option key={s._id} value={s._id}>
                        {formatStudentOption(s)}
                      </option>
                    ))}
                  </select>
                  {filteredStudents.length === 0 && searchTerm && (
                    <p className="text-sm text-red-500 mt-1">No students found</p>
                  )}
                </>
              ) : (
                <>
                  <select
                    value={selectedTeacher}
                    onChange={e => setSelectedTeacher(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    size={5}
                  >
                    <option value="">-- Select Teacher --</option>
                    {filteredTeachers.map(t => (
                      <option key={t._id} value={t._id}>
                        {formatTeacherOption(t)}
                      </option>
                    ))}
                  </select>
                  {filteredTeachers.length === 0 && searchTerm && (
                    <p className="text-sm text-red-500 mt-1">No teachers found</p>
                  )}
                </>
              )}
            </div>

            {/* Certificate Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                <FiFileText className="inline mr-2 text-green-600" />
                Certificate Type
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {CERTIFICATE_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedType(type.value);
                      setSelectedTemplate('');
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedType === type.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className={`text-xl ${selectedType === type.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-700 mt-1">{type.label}</p>
                  </button>
                ))}
              </div>

              {/* Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Session <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={academicSession}
                    onChange={e => setAcademicSession(e.target.value)}
                    placeholder="e.g., 2026-2027"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full pl-10 p-2.5 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason / Purpose
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g., Passport application, higher education, transfer..."
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={e => { setSelectedTemplate(e.target.value); setCustomValues({}); }}
                  className="w-full p-2.5 border rounded-lg"
                >
                  <option value="">-- Select Template --</option>
                  {matchingTemplates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {matchingTemplates.length
                    ? `${matchingTemplates.length} template${matchingTemplates.length === 1 ? '' : 's'} available for ${selectedTypeMeta?.label || 'this certificate'}.`
                    : 'Create and activate a template before generating this certificate.'}
                </p>
              </div>

              {customInputFields.length > 0 && (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-3">
                  <h3 className="font-medium text-gray-800">Custom document fields</h3>
                  {customInputFields.map(field => (
                    <label key={field.key} className="block text-sm font-medium text-gray-700">
                      {field.label || field.key}{field.required ? ' *' : ''}
                      <div className="mt-1">
                        {field.inputType === 'textarea' ? (
                          <textarea rows={3} value={customValues[field.key] ?? field.defaultValue ?? ''} onChange={e => setCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))} className="w-full p-2.5 border rounded-lg" />
                        ) : field.inputType === 'select' ? (
                          <select value={customValues[field.key] ?? field.defaultValue ?? ''} onChange={e => setCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))} className="w-full p-2.5 border rounded-lg">
                            <option value="">Choose {field.label || 'a value'}</option>
                            {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input type={['date', 'number'].includes(field.inputType) ? field.inputType : 'text'} value={customValues[field.key] ?? field.defaultValue ?? ''} onChange={e => setCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))} className="w-full p-2.5 border rounded-lg" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="font-medium flex items-center gap-2 mb-2">
                    <FiAlertCircle /> Required before generation
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map(error => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <>Generating...</>
                ) : (
                  <><FiDownload /> Generate & Download Certificate</>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <FiFileText className="text-3xl mb-2" />
              <h3 className="font-semibold text-lg">Certificates</h3>
              <p className="text-sm opacity-90 mt-1">
                Generate bonafide, character, transfer, and more certificates with a single click.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <FiCheckCircle /> Auto-filled data
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiCheckCircle /> QR verified
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiCheckCircle /> Digital signature
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <FiClock /> Recently Generated
              </h3>
              {recentCertificates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No certificates yet</p>
              ) : (
                <div className="space-y-2">
                  {recentCertificates.map(cert => (
                    <div key={cert._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {cert.title || 'Certificate'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(cert.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickDownload(cert._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
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

export default CertificateGenerator;
