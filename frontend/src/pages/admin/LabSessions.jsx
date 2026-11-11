import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiCalendar, FiClock, FiBook, FiTrash2 } from 'react-icons/fi';
import Select from 'react-select';

const LabSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    labId: '',
    classId: '',
    teacherId: '',
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchLabs();
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/lab/sessions');
      setSessions(data);
    } catch (error) {
      toast.error('Failed to load sessions');
    }
  };

  const fetchLabs = async () => {
    const { data } = await api.get('/lab/labs');
    setLabs(data);
  };

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const fetchTeachers = async () => {
    const { data } = await api.get('/teachers');
    setTeachers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.labId || !form.classId || !form.teacherId || !form.date) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      await api.post('/lab/sessions', form);
      toast.success('Session created');
      setShowForm(false);
      setForm({ labId: '', classId: '', teacherId: '', date: '', startTime: '', endTime: '', topic: '' });
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/lab/sessions/${id}`);
      toast.success('Session deleted');
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const labOptions = labs.map(l => ({ value: l._id, label: l.name }));
  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const teacherOptions = teachers.map(t => ({ value: t._id, label: t.userId?.name }));

  return (
    <Layout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lab Sessions</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center">
          <FiPlus className="mr-2" /> New Session
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Lab Session</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Select class..."
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teacher *</label>
              <Select
                options={teacherOptions}
                value={teacherOptions.find(o => o.value === form.teacherId) || null}
                onChange={opt => setForm({ ...form, teacherId: opt?.value || '' })}
                placeholder="Select teacher..."
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Topic / Experiment</label>
              <input type="text" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="input-field" placeholder="e.g., Ohm's Law" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Session'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-gray-500">No lab sessions created yet.</p>
        ) : (
          sessions.map(s => (
            <div key={s._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{s.topic || 'No topic'}</h3>
                <div className="flex items-center gap-3">
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
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span><FiBook className="inline mr-1" /> Lab: {s.labId?.name}</span>
                <span>Class: {s.classId?.name || 'N/A'}</span>
                <span>Teacher: {s.teacherId?.userId?.name}</span>
                {s.startTime && (
                  <span><FiClock className="inline mr-1" /> {s.startTime} - {s.endTime}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default LabSessions;