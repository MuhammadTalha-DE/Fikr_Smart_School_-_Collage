import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiDownload, FiFileText, FiEdit3, FiSend, FiSearch } from 'react-icons/fi';
import {
  downloadBase64Pdf,
  filterStudents,
  formatStudentOption,
  formatTeacherOption,
} from '../../utils/documentUtils';

const LETTER_TYPES = [
  { value: 'official_letter', label: 'Official Letter' },
  { value: 'circular', label: 'Circular' },
  { value: 'notice', label: 'Notice/Announcement' },
  { value: 'discipline_notice', label: 'Discipline Notice' },
  { value: 'parent_meeting', label: 'Parent Meeting Letter' },
  { value: 'appointment', label: 'Appointment Letter' },
  { value: 'joining_letter', label: 'Joining Letter' },
  { value: 'relieving', label: 'Relieving Letter' },
  { value: 'enrollment_confirmation', label: 'Enrollment Confirmation' },
  { value: 'event_certificate', label: 'Event Certificate' },
];

const OfficialLetters = () => {
  const [selectedType, setSelectedType] = useState('official_letter');
  const [recipientRole, setRecipientRole] = useState('student');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const [{ data: studentData }, { data: teacherData }] = await Promise.all([
        api.get('/students'),
        api.get('/teachers'),
      ]);
      setStudents((studentData || []).sort((a, b) => (a.userId?.name || '').localeCompare(b.userId?.name || '')));
      setTeachers(teacherData || []);
    } catch (err) {
      console.error('Failed to load recipients');
    }
  };

  const filteredRecipients = recipientRole === 'student'
    ? filterStudents(students, recipientSearch)
    : teachers.filter(teacher => {
      const term = recipientSearch.trim().toLowerCase();
      if (!term) return true;
      return [
        teacher?.userId?.name,
        teacher?.employeeId,
        ...(teacher?.subjects || []),
      ].some(value => String(value || '').toLowerCase().includes(term));
    });

  const handleGenerate = async () => {
    if (!selectedRecipient) return toast.error('Select a recipient');
    if (!subject || !body) return toast.error('Subject and body are required');
    setLoading(true);
    try {
      const { data } = await api.post('/documents/generate', {
        templateId: null,
        ownerType: recipientRole,
        ownerId: selectedRecipient,
        documentType: selectedType,
        reason: subject,
        subject,
        body,
      });

      downloadBase64Pdf(data.pdfBuffer, `${selectedType}_${data.metadata?.studentName || Date.now()}.pdf`);
      toast.success('Letter generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Official Letters & Notices</h1>
        <p className="text-gray-500 mb-8">Generate official school communications</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Document Type</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LETTER_TYPES.map(lt => (
                  <button
                    key={lt.value}
                    onClick={() => setSelectedType(lt.value)}
                    className={`p-3 rounded-lg border text-sm text-left transition ${
                      selectedType === lt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FiFileText className={`inline mr-1 ${selectedType === lt.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    {lt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                <FiEdit3 className="inline mr-2 text-blue-600" />
                Letter Content
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={recipientRole}
                    onChange={e => {
                      setRecipientRole(e.target.value);
                      setSelectedRecipient('');
                      setRecipientSearch('');
                    }}
                    className="p-2.5 border rounded-lg"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                  </select>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={e => setRecipientSearch(e.target.value)}
                      placeholder="Search recipient..."
                      className="w-full pl-10 p-2.5 border rounded-lg"
                    />
                  </div>
                </div>
                <select
                  value={selectedRecipient}
                  onChange={e => setSelectedRecipient(e.target.value)}
                  className="mt-3 w-full p-2.5 border rounded-lg"
                  size={5}
                >
                  <option value="">-- Select Recipient --</option>
                  {filteredRecipients.map(recipient => (
                    <option key={recipient._id} value={recipient._id}>
                      {recipientRole === 'student' ? formatStudentOption(recipient) : formatTeacherOption(recipient)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Letter subject..."
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Write your letter content here..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !selectedRecipient}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                  loading || !selectedRecipient ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generating...' : <><FiDownload /> Generate PDF</>}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white h-fit">
            <FiSend className="text-3xl mb-2" />
            <h3 className="font-semibold text-lg">Official Communications</h3>
            <p className="text-sm opacity-90 mt-2">
              Generate professionally formatted letters, circulars, notices, and more with school branding.
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li>✓ School letterhead</li>
              <li>✓ Principal signature</li>
              <li>✓ Date & reference numbers</li>
              <li>✓ QR verification</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OfficialLetters;
