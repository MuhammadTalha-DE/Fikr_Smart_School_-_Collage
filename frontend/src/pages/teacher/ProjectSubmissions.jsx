import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiFileText, FiCalendar, FiCheckCircle,
  FiExternalLink, FiUser, FiStar, FiRefreshCw
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const ProjectSubmissions = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading modal state
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, subRes] = await Promise.all([
        api.get(`/lab/projects/${projectId}`),
        api.get(`/lab/projects/${projectId}/submissions`),
      ]);
      setProject(projRes.data.project);
      // Ensure we always have an array
      const subs = subRes.data || [];
      setSubmissions(Array.isArray(subs) ? subs : []);
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const openGradeModal = (submission) => {
    setGrading(submission);
    setGradeForm({
      marks: submission.marksObtained ?? '',
      feedback: submission.feedback ?? '',
    });
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradeForm.marks) return toast.error('Please enter marks');
    setSavingGrade(true);
    try {
      await api.put('/lab/projects/submissions/grade', {
        submissionId: grading._id,
        marks: parseFloat(gradeForm.marks),
        feedback: gradeForm.feedback,
      });
      toast.success('Marks saved');
      setGrading(null);
      // Refetch immediately after grading
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project?.title} – Submissions</h1>
            <p className="text-sm text-gray-500">
              {project?.classId?.name} · Max Marks: {project?.maxMarks} ·{' '}
              {submissions.length} / {project?.classId?.students?.length || '?'} submitted
            </p>
          </div>
        </div>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-3" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Roll No</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={sub.student?.userId?.avatar}
                          name={sub.student?.userId?.name}
                          size="w-8 h-8"
                        />
                        <span className="font-medium">{sub.student?.userId?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {sub.student?.rollNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" /> View
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {sub.marksObtained != null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <FiCheckCircle /> {sub.marksObtained}/{project?.maxMarks}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-sm">Not graded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openGradeModal(sub)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {sub.marksObtained != null ? 'Edit Grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grade Modal */}
        {grading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-bold mb-4">
                Grade: {grading.student?.userId?.name}
              </h2>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marks *</label>
                  <input
                    type="number"
                    value={gradeForm.marks}
                    onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                    className="input-field"
                    max={project?.maxMarks}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Feedback</label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    className="input-field"
                    rows="2"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setGrading(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={savingGrade} className="btn-primary bg-blue-600 text-white">
                    {savingGrade ? 'Saving…' : 'Save Grade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectSubmissions;