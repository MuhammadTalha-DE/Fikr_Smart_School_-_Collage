import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiLink, FiFile, FiArrowLeft, FiSend } from 'react-icons/fi';

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [submissionType, setSubmissionType] = useState('url'); // 'url' or 'file'
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10 MB');
      return;
    }
    setSelectedFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submissionType === 'url' && !fileUrl.trim()) {
      return toast.error('Please enter a URL');
    }
    if (submissionType === 'file' && !selectedFile) {
      return toast.error('Please select a file');
    }

    setSubmitting(true);
    try {
      if (submissionType === 'url') {
        // Submit as JSON
        await api.post(`/assignments/${assignmentId}/submit`, { fileUrl });
      } else {
        // Submit as FormData (multipart)
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/assignments/${assignmentId}/submit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Assignment submitted successfully!');
      navigate('/student/assignments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout role="student">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <FiArrowLeft /> Back to Assignments
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Assignment</h1>
          <p className="text-sm text-gray-500 mb-6">Choose a method to submit your work.</p>

          {/* Submission type tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSubmissionType('url')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                submissionType === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiLink /> URL
            </button>
            <button
              onClick={() => setSubmissionType('file')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                submissionType === 'file'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiFile /> File Upload
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {submissionType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Submission URL *
                </label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Paste a link to your work (Google Drive, GitHub Pages, etc.)
                </p>
              </div>
            )}

            {submissionType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Choose File *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100 transition cursor-pointer"
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Max size: 10 MB. Supported: PDF, Word, images, ZIP.
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    ✅ Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
              >
                <FiSend />
                {submitting ? 'Submitting…' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitAssignment;