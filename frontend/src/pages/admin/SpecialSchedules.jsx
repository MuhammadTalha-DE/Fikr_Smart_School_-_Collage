import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiClock } from 'react-icons/fi';

const SpecialSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', scheduleType: 'ramadan', academicYear: '', startDate: '', endDate: '', description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get('/special-schedules');
      setSchedules(data);
    } catch { toast.error('Failed to load schedules'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/special-schedules/${editing._id}`, form);
        toast.success('Schedule updated');
      } else {
        await api.post('/special-schedules', form);
        toast.success('Schedule created');
      }
      setShowForm(false);
      setForm({ name: '', scheduleType: 'ramadan', academicYear: '', startDate: '', endDate: '', description: '' });
      setEditing(null);
      fetchSchedules();
    } catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/special-schedules/${id}`);
      toast.success('Deleted');
      fetchSchedules();
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setForm({
      name: schedule.name,
      scheduleType: schedule.scheduleType,
      academicYear: schedule.academicYear || '',
      startDate: schedule.startDate?.slice(0, 10) || '',
      endDate: schedule.endDate?.slice(0, 10) || '',
      description: schedule.description || '',
    });
    setShowForm(true);
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FiClock className="text-pink-500" /> Special Schedules
        </h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white">
          <FiPlus className="mr-1" /> Add Schedule
        </button>
      </div>

      {showForm && (
        <div className="card border-pink-100 p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Create'} Special Schedule</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
            <select value={form.scheduleType} onChange={e => setForm({...form, scheduleType: e.target.value})} className="input-field">
              <option value="ramadan">Ramadan</option>
              <option value="exam">Exam Week</option>
              <option value="half-day">Half Day</option>
              <option value="custom">Custom</option>
            </select>
            <input type="text" placeholder="Academic Year (e.g. 2025-2026)" value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} className="input-field" />
            <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="input-field" required />
            <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="input-field" required />
            <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field md:col-span-2" rows="2" />
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map(sch => (
          <div key={sch._id} className="card border-pink-100 p-5">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-900">{sch.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(sch)} className="text-blue-600"><FiEdit2 /></button>
                <button onClick={() => handleDelete(sch._id)} className="text-red-500"><FiTrash2 /></button>
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase mt-1">{sch.scheduleType}</p>
            <p className="text-sm text-slate-600 mt-2">
              <FiCalendar className="inline mr-1" /> {new Date(sch.startDate).toLocaleDateString()} – {new Date(sch.endDate).toLocaleDateString()}
            </p>
            {sch.description && <p className="text-sm text-slate-500 mt-1">{sch.description}</p>}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default SpecialSchedules;