import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiCheckCircle, FiClock, FiExternalLink, FiEdit2
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const AssignmentSubmissions = () => {
  const { id } = useParams();   // assignment ID
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [roster, setRoster] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading modal
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch assignment (contains classId as populated object or string)
      const { data: asgData } = await api.get(`/assignments/${id}`);
      const asg = asgData;
      setAssignment(asg);

      // 2. Extract the class ID safely
      const classId = typeof asg.classId === 'object' ? asg.classId._id : asg.classId;

      if (classId) {
        // 3. Fetch roster (students in the class)
        const { data: rosterData } = await api.get(`/classes/${classId}/students`);
        const students = rosterData || [];
        setRoster(students);
      } else {
        setRoster([]);
      }

      // 4. Fetch submissions for this assignment
      const { data: subsData } = await api.get(`/assignments/${id}/submissions`);
      const subs = subsData || [];
      setSubmissions(subs);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  // Merge roster + submissions
  const mergedStudents = roster.map((student) => {
    const submission = submissions.find(
      (s) => (s.studentId?._id || s.studentId) === student._id
    );
    return { student, submission: submission || null };
  });

  // Open grading modal
  const openGradeModal = (submission) => {
    setGrading(submission);
    setGradeForm({
      marks: submission?.marks ?? '',
      feedback: submission?.feedback ?? '',
    });
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradeForm.marks) return toast.error('Marks are required');
    setSavingGrade(true);
    try {
      await api.put('/assignments/grade', {
        assignmentId: id,
        studentId: grading.studentId?._id || grading.studentId,
        marks: parseFloat(gradeForm.marks),
        feedback: gradeForm.feedback,
      });
      toast.success('Grade saved');
      setGrading(null);
      fetchAll(); // refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading…</div></Layout>;

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment?.title} – Submissions
            </h1>
            <p className="text-sm text-gray-500">
              {assignment?.classId?.name || 'Class'} · Due: {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'} ·{' '}
              {submissions.length}/{roster.length} submitted
            </p>
          </div>
        </div>

        {/* Student Table */}
        {mergedStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No students found in this class.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Roll No</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Submitted</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mergedStudents.map(({ student, submission }) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={student.userId?.avatar}
                          name={student.userId?.name}
                          size="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{student.userId?.name}</p>
                          <p className="text-xs text-gray-500">{student.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {student.rollNumber || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {submission ? (
                        <span className="flex items-center gap-1 text-green-700">
                          <FiCheckCircle /> {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500">
                          <FiClock /> Not submitted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {submission?.fileUrl ? (
                        <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          <FiExternalLink /> View
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {submission?.marks != null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          {submission.marks}
                        </span>
                      ) : submission ? (
                        <span className="text-amber-600 text-sm">Not graded</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {submission && (
                        <button
                          onClick={() => openGradeModal(submission)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ml-auto"
                        >
                          <FiEdit2 /> {submission.marks != null ? 'Edit' : 'Grade'}
                        </button>
                      )}
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
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-bold mb-4">Grade Submission</h2>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marks *</label>
                  <input
                    type="number"
                    value={gradeForm.marks}
                    onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                    className="input-field"
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
                    placeholder="Optional feedback for the student"
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

export default AssignmentSubmissions;