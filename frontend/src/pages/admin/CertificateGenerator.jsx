import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiDownload, FiFileText, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CertificateGenerator = () => {
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    templateType: 'bonafide',
    reason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all students (sorted by name) on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/students'); // adjust if paginated
        // Sort alphabetically by user name (case-insensitive)
        const sorted = data.sort((a, b) => {
          const nameA = (a.userId?.name || a._id).toLowerCase();
          const nameB = (b.userId?.name || b._id).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setStudents(sorted);
      } catch (err) {
        toast.error('Failed to load students');
      }
    };

    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/certificates/templates');
        setTemplates(data);
      } catch (err) { /* ignore */ }
    };

    fetchStudents();
    fetchTemplates();
  }, []);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => {
      const name = (s.userId?.name || '').toLowerCase();
      const roll = (s.rollNumber || '').toLowerCase();
      const admission = (s.admissionNumber || '').toLowerCase();
      const email = (s.userId?.email || '').toLowerCase();
      const username = (s.userId?.username || '').toLowerCase(); // if exists
      return (
        name.includes(term) ||
        roll.includes(term) ||
        admission.includes(term) ||
        email.includes(term) ||
        username.includes(term)
      );
    });
  }, [students, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId) return toast.error('Select a student');
    setLoading(true);
    try {
      const response = await api.post('/certificates/generate', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Certificate generated');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Certificate Generator</h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Student
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Name, roll no, admission no, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFormData({ ...formData, studentId: '' }); // reset selection on new search
                }}
                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Student Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full p-2 border rounded-lg"
              size={Math.min(filteredStudents.length + 1, 6)} // show a listbox
              required
            >
              <option value="">-- Select Student --</option>
              {filteredStudents.map(s => (
                <option key={s._id} value={s._id}>
                  {s.userId?.name || s._id} 
                  {s.rollNumber ? ` (Roll: ${s.rollNumber})` : ''} 
                  {s.admissionNumber ? ` - Adm: ${s.admissionNumber}` : ''}
                </option>
              ))}
            </select>
            {filteredStudents.length === 0 && searchTerm && (
              <p className="text-sm text-red-500 mt-1">No students match your search.</p>
            )}
          </div>

          {/* Certificate Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              {templates.map(t => (
                <option key={t.type} value={t.type}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Reason / Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Purpose
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Passport application, transfer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiDownload /> {loading ? 'Generating...' : 'Generate & Download'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CertificateGenerator;