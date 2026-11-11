import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiAward, FiCalendar } from 'react-icons/fi';
import Select from 'react-select';
import Avatar from '../../components/common/Avatar';

const ActivityLog = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    activityName: '',
    category: 'sports',
    role: 'participant',
    achievement: '',
    eventDate: new Date().toISOString().slice(0, 10),
    points: 5,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchActivities();
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

  const fetchActivities = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const { data } = await api.get('/behaviour/activity/logs');
      setActivities(data.activities || []);
    } catch { toast.error('Failed to load activities'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.activityName) return toast.error('Student and activity name are required');
    setSaving(true);
    try {
      await api.post('/behaviour/activity/log', form);
      toast.success('Activity logged');
      setForm({
        studentId: '',
        activityName: '',
        category: 'sports',
        role: 'participant',
        achievement: '',
        eventDate: new Date().toISOString().slice(0, 10),
        points: 5,
      });
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      await api.delete(`/behaviour/activity/${id}`);
      toast.success('Deleted');
      fetchActivities();
    } catch { toast.error('Delete failed'); }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const studentOptions = students.map(s => ({
    value: s._id,
    label: s.userId?.name || 'Unknown',
    avatar: s.userId?.avatar,
  }));

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">🏅 Activity Log</h1>

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
            <h2 className="font-semibold mb-4">New Activity Entry</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                <label className="block text-sm font-medium mb-1">Activity Name</label>
                <input
                  type="text"
                  value={form.activityName}
                  onChange={e => setForm({...form, activityName: e.target.value})}
                  placeholder="e.g., Annual Sports Day"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="input-field bg-white"
                >
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="club">Club</option>
                  <option value="community_service">Community Service</option>
                  <option value="academic">Academic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                  className="input-field bg-white"
                >
                  <option value="participant">Participant</option>
                  <option value="winner">Winner</option>
                  <option value="organizer">Organizer</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Achievement (optional)</label>
                <input
                  type="text"
                  value={form.achievement}
                  onChange={e => setForm({...form, achievement: e.target.value})}
                  placeholder="e.g., 1st Prize"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Date</label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={e => setForm({...form, eventDate: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={e => setForm({...form, points: Number(e.target.value)})}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end md:col-span-3">
                <button type="submit" disabled={saving} className="btn-primary bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2">
                  <FiPlus /> {saving ? 'Saving…' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activity List */}
        {selectedClass && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <h2 className="font-semibold p-5 border-b">Recent Activities</h2>
            {loading ? (
              <p className="p-5 text-gray-500">Loading…</p>
            ) : activities.length === 0 ? (
              <p className="p-5 text-gray-500">No activities logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Activity</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Role</th>
                      <th className="px-4 py-3 text-center">Points</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.map(act => (
                      <tr key={act._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={act.student?.userId?.avatar}
                              name={act.student?.userId?.name}
                              size="w-7 h-7"
                            />
                            <span className="font-medium">{act.student?.userId?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{act.activityName}</p>
                          {act.achievement && <p className="text-xs text-gray-500">{act.achievement}</p>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-600 capitalize">
                          {act.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-600 capitalize">
                          {act.role}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-green-600">+{act.points}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                          {new Date(act.eventDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(act._id)} className="text-red-500 hover:text-red-700">
                            <FiTrash2 />
                          </button>
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

export default ActivityLog;