import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiBook, FiClock, FiCalendar, FiPlus, FiTrash2 } from 'react-icons/fi';
import Select from 'react-select';
import toast from 'react-hot-toast';

const TeacherLabDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLabForm, setShowLabForm] = useState(false);
  const [form, setForm] = useState({
    labId: '',
    classId: '',
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
  });
  const [labForm, setLabForm] = useState({ name: '', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [creatingLab, setCreatingLab] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, labsRes, classesRes] = await Promise.all([
        api.get('/lab/sessions'),
        api.get('/lab/labs'),
        api.get('/classes/my-classes'),
      ]);
      setSessions(sessionsRes.data || []);
      setLabs(labsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error('Failed to load lab data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!form.labId || !form.classId || !form.date) {
      return toast.error('Lab, class, and date are required');
    }
    setSubmitting(true);
    try {
      await api.post('/lab/sessions', form);
      toast.success('Session created');
      setShowForm(false);
      setForm({ labId: '', classId: '', date: '', startTime: '', endTime: '', topic: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLab = async (e) => {
    e.preventDefault();
    if (!labForm.name) return toast.error('Lab name is required');
    setCreatingLab(true);
    try {
      await api.post('/lab/labs', labForm);
      toast.success('Lab created');
      setShowLabForm(false);
      setLabForm({ name: '', description: '', location: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create lab');
    } finally {
      setCreatingLab(false);
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/lab/sessions/${id}`);
      toast.success('Session deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const labOptions = labs.map(l => ({ value: l._id, label: l.name }));
  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  // Filter sessions for display
  const todayStr = new Date().toISOString().split('T')[0];
  let displayedSessions = sessions;
  if (filterClass) {
    displayedSessions = displayedSessions.filter(s => s.classId?._id === filterClass);
  }
  const todaySessions = displayedSessions.filter(s => s.date?.startsWith(todayStr));
  const upcomingSessions = displayedSessions.filter(s => s.date > todayStr);
  const pastSessions = displayedSessions.filter(s => s.date < todayStr);

  return (
    <Layout role="teacher">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Lab Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowLabForm(!showLabForm)} className="btn-secondary flex items-center">
            <FiPlus className="mr-2" /> Create Lab
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center">
            <FiPlus className="mr-2" /> Create Session
          </button>
        </div>
      </div>

      {/* Create Lab Form */}
      {showLabForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Create a New Lab</h2>
          <form onSubmit={handleCreateLab} className="space-y-4">
            <input
              type="text"
              placeholder="Lab Name *"
              value={labForm.name}
              onChange={e => setLabForm({ ...labForm, name: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={labForm.description}
              onChange={e => setLabForm({ ...labForm, description: e.target.value })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Location"
              value={labForm.location}
              onChange={e => setLabForm({ ...labForm, location: e.target.value })}
              className="input-field"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowLabForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={creatingLab} className="btn-primary">
                {creatingLab ? 'Creating...' : 'Create Lab'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Session Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Lab Session</h2>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lab *</label>
              <Select
                options={labOptions}
                value={labOptions.find(o => o.value === form.labId) || null}
                onChange={opt => setForm({ ...form, labId: opt?.value || '' })}
                placeholder="Select lab..."
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Select
                options={classOptions}
                value={classOptions.find(o => o.value === form.classId) || null}
                onChange={opt => setForm({ ...form, classId: opt?.value || '' })}
                placeholder="Select a class... (required)"
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Topic / Experiment</label>
              <input
                type="text"
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="input-field"
                placeholder="e.g. Ohm's Law"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter control */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium">Filter by class:</label>
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="input-field w-48"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading sessions...</p>
      ) : (
        <>
          {/* Today's sessions */}
          <Section title="Today's Sessions" sessions={todaySessions} deleteSession={deleteSession} />
          {/* Upcoming sessions */}
          <Section title="Upcoming Sessions" sessions={upcomingSessions} deleteSession={deleteSession} />
          {/* Past sessions */}
          <Section title="Past Sessions" sessions={pastSessions} deleteSession={deleteSession} />
          {displayedSessions.length === 0 && (
            <p className="text-gray-500">No lab sessions found.</p>
          )}
        </>
      )}
    </Layout>
  );
};

// Small helper component for each section
const Section = ({ title, sessions, deleteSession }) => {
  if (sessions.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => (
          <div key={s._id} className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg flex items-center">
                <FiBook className="mr-2 text-primary-500" /> {s.topic || 'No topic'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{new Date(s.date).toLocaleDateString()}</span>
                <button
                  onClick={() => deleteSession(s._id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete Session"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Lab:</span> {s.labId?.name}</p>
              <p><span className="font-medium">Class:</span> {s.classId?.name || 'N/A'}</p>
              <p className="flex items-center">
                <FiCalendar className="mr-1" /> {new Date(s.date).toLocaleDateString()}
                {s.startTime && (
                  <span className="ml-2"><FiClock className="inline mr-1" />{s.startTime} - {s.endTime}</span>
                )}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/teacher/lab/attendance/${s._id}`} className="btn-primary text-sm py-1 px-3">
                Attendance
              </Link>
              <Link to={`/teacher/lab/marks/${s._id}`} className="btn-secondary text-sm py-1 px-3">
                Practical Marks
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherLabDashboard;