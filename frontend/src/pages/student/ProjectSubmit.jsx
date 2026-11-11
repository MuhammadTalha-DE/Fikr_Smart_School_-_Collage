import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiArrowLeft } from 'react-icons/fi';

const ProjectSubmit = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/lab/projects/${projectId}`);
        setProject(data.project);
      } catch (err) {
        toast.error('Failed to load project');
        navigate('/student/projects');
      }
    };
    fetchProject();
  }, [projectId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      return toast.error('Please provide a file URL');
    }
    setSubmitting(true);
    try {
      await api.post('/lab/projects/submit', { projectId, fileUrl });
      toast.success('Submission successful!');
      navigate('/student/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout role="student">
      <div className="max-w-xl mx-auto py-6 px-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-gray-600 hover:text-gray-800">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Project</h1>
        {project && (
          <p className="text-gray-500 mb-6">{project.title} – {project.subject}</p>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">File URL *</label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... or uploaded file link"
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload your file to Google Drive, Dropbox, or any cloud storage and paste the shared link here.
            </p>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary bg-blue-600 text-white flex items-center gap-2">
            <FiUpload /> {submitting ? 'Submitting…' : 'Submit Project'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ProjectSubmit;