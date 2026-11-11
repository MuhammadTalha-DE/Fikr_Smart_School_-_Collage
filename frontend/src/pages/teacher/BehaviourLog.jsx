import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiThumbsUp, FiAlertTriangle } from 'react-icons/fi';
import Select from 'react-select';
import Avatar from '../../components/common/Avatar';

const BehaviourLog = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    category: '',
    severity: 'minor',
    description: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchLogs();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await api.get('/classes/my-classes');
    setClasses(data);
  };

  const fetchStudents = async (classId) => {
    try {
      const { data } = await api.get(`/classes/${classId}/students`);
      setStudents(data);
    } catch { setStudents([]); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/behaviour/categories');
      setCategories(data.categories || []);
    } catch { setCategories([]); }
  };

  const fetchLogs = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const { data } = await api.get('/behaviour/logs', { params: { classId: selectedClass } });
      setLogs(data.logs || []);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.category) return toast.error('Student and category are required');
    setSaving(true);
    try {
      await api.post('/behaviour/log', {
        ...form,
        classId: selectedClass,
      });
      toast.success('Behaviour logged');
      setForm({ studentId: '', category: '', severity: 'minor', description: '' });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const studentOptions = students.map(s => ({
    value: s._id,
    label: s.userId?.name || 'Unknown',
    avatar: s.userId?.avatar,
  }));
  const categoryOptions = categories
    .filter(c => c.name !== 'other')
    .map(c => ({
      value: c.name,
      label: `${c.label} (${c.defaultPoints > 0 ? '+' : ''}${c.defaultPoints} pts)`,
      type: c.type,
    }));

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">📝 Behaviour Log</h1>

        {/* Class Selector */}
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">Select Class</label>
          <Select
            options={classOptions}
            value={classOptions.find(o => o.value === selectedClass) || null}
            onChange={opt => setSelectedClass(opt?.value || '')}
            placeholder="Choose a class"
          />
        </div>

        {/* Log Form */}
        {selectedClass && (
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h2 className="font-semibold mb-4">New Behaviour Entry</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <Select
                  options={studentOptions}
                  value={studentOptions.find(o => o.value === form.studentId) || null}
                  onChange={opt => setForm({...form, studentId: opt?.value || ''})}
                  placeholder="Select student"
                  formatOptionLabel={(opt) => (
                    <div className="flex items-center gap-2">
                      <Avatar src={opt.avatar} name={opt.label} size="w-6 h-6" />
                      {opt.label}
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Select</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select
                  value={form.severity}
                  onChange={e => setForm({...form, severity: e.target.value})}
                  className="input-field bg-white"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="serious">Serious</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of the incident..."
                  className="input-field"
                />
              </div>
              <div className="flex justify-end md:col-span-4">
                <button type="submit" disabled={saving} className="btn-primary bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2">
                  <FiPlus /> {saving ? 'Saving…' : 'Log Behaviour'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Logs */}
        {selectedClass && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <h2 className="font-semibold p-5 border-b">Recent Behaviour Logs</h2>
            {loading ? (
              <p className="p-5 text-gray-500">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="p-5 text-gray-500">No behaviour logs for this class yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>
                      <th className="px-4 py-3 text-center">Points</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar src={log.student?.userId?.avatar} name={log.student?.userId?.name} size="w-7 h-7" />
                            <span className="font-medium">{log.student?.userId?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                          {log.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            log.type === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          <span className={log.points > 0 ? 'text-green-600' : 'text-red-600'}>
                            {log.points > 0 ? '+' : ''}{log.points}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BehaviourLog;