import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';
import { FiUsers, FiCheckSquare, FiClipboard, FiFileText,FiBell, FiClock, FiCalendar } from 'react-icons/fi';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const { periods } = useSchoolPeriods();

  // ---------- Time helpers ----------
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const getCurrentPeriod = () => {
    const startHour = 8;          // school starts at 8:00
    const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
    if (totalMinutes < 0) return 0;
    // assume 45‑min periods, max 8 periods
    return Math.min(Math.ceil(totalMinutes / 45), 8);
  };
  const activePeriod = getCurrentPeriod();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, annRes, schedRes] = await Promise.all([
        api.get('/classes/my-classes'),
        api.get('/announcements'),
        api.get('/teachers/schedule'),
      ]);
      setClasses(classesRes.data);
      setAnnouncements(
        annRes.data
          .filter(a => a.targetRole === 'all' || a.targetRole === 'teacher')
          .slice(0, 5)
      );
      setSchedule(schedRes.data || []);
    } catch (error) {
      console.error('Dashboard fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  // Process today's schedule
  const todaySlots = schedule
    .filter(s => s.day === todayName)
    .sort((a, b) => a.period - b.period);
  const busyPeriods = todaySlots.map(s => s.period);
  const freePeriods = periods.filter(p => !busyPeriods.includes(p));

  const quickActions = [
    { title: 'Take Attendance', icon: FiCheckSquare, link: '/teacher/attendance', color: 'bg-blue-500' },
    { title: 'Enter Marks', icon: FiClipboard, link: '/teacher/marks', color: 'bg-green-500' },
    { title: 'Assignments', icon: FiFileText, link: '/teacher/assignments', color: 'bg-purple-500' },
    { title: 'My Classes', icon: FiUsers, link: '/teacher/classes', color: 'bg-orange-500' },
  ];

  return (
    <Layout role="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back! Here's your daily overview.</p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {quickActions.map((action, idx) => (
          <Link
            key={idx}
            to={action.link}
            className={`${action.color} rounded-xl shadow-sm p-4 text-white hover:opacity-90 transition flex flex-col items-center justify-center`}
          >
            <action.icon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">{action.title}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column – Today's Schedule + Free Periods */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="card border-pink-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <FiCalendar className="mr-2 text-pink-500" />
              Today's Schedule – {todayName}
            </h2>
            {todaySlots.length === 0 ? (
              <p className="text-slate-500">No classes scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {todaySlots.map(slot => {
                  const isActive = slot.period === activePeriod;
                  return (
                    <div
                      key={slot.period}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 w-8">
                          P{slot.period}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{slot.subject}</p>
                          <p className="text-xs text-slate-500">{slot.class}</p>
                        </div>
                        {isActive && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/teacher/attendance?class=${slot.classId}`}
                          className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                        >
                          Attendance
                        </Link>
                        <Link
                          to={`/teacher/marks?class=${slot.classId}`}
                          className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                        >
                          Marks
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Free Periods */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Free Periods</h3>
              <div className="flex flex-wrap gap-2">
                {freePeriods.length > 0 ? (
                  freePeriods.map(p => (
                    <span
                      key={p}
                      className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-100"
                    >
                      P{p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">All periods busy today</span>
                )}
              </div>
            </div>
          </div>

          {/* My Classes (unchanged card from existing) */}
          <div className="card border-pink-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              <FiUsers className="inline mr-2 text-pink-500" />
              My Classes
            </h2>
            {classes.length === 0 ? (
              <p className="text-slate-500">No classes assigned yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {classes.map(cls => {
                  const isClassTeacher = cls.teacherId?._id === /* get current teacher id */ null; // you might have teacherId from profile, adjust accordingly
                  return (
                    <li key={cls._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800">
                          {cls.name}
                          {isClassTeacher && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
                              Class Teacher
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{cls.students?.length || 0} students</p>
                      </div>
                      <Link
                        to={`/teacher/classes/${cls._id}`}
                        className="text-sm text-pink-600 hover:text-pink-800 font-medium"
                      >
                        View Details →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column – Announcements */}
        <div className="space-y-6">
          <div className="card border-pink-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              <FiBell className="inline mr-2 text-pink-500" />
              Recent Announcements
            </h2>
            {announcements.length === 0 ? (
              <p className="text-slate-500">No announcements.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {announcements.map(ann => (
                  <li key={ann._id} className="py-3">
                    <p className="font-medium text-slate-800">{ann.title}</p>
                    <p className="text-sm text-slate-600 truncate">{ann.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;









import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiFileText, FiCalendar, FiCheckCircle,
  FiExternalLink, FiUser, FiStar
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

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projRes, subRes] = await Promise.all([
        api.get(`/lab/projects/${projectId}`),
        api.get(`/lab/projects/${projectId}/submissions`),
      ]);
      setProject(projRes.data.project);
      setSubmissions(subRes.data || []);
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

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
