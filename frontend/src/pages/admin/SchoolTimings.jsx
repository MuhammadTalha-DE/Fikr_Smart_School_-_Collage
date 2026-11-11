import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';

const SchoolTimings = () => {
  const [periods, setPeriods] = useState([{ periodNumber: 1, startTime: '08:25', endTime: '09:05', type: 'class' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const { data } = await api.get('/school-periods');
      if (data.length > 0) setPeriods(data);
    } catch { /* ignore */ }
  };

  const handleAddRow = () => {
    setPeriods([...periods, { periodNumber: periods.length + 1, startTime: '', endTime: '', type: 'class' }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...periods];
    updated[index][field] = value;
    setPeriods(updated);
  };

  const handleRemove = (index) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/school-periods/bulk', { periods });
      toast.success('Timings saved');
      fetchPeriods();
    } catch {
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="admin">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <FiClock className="text-pink-500" /> School Period Timings
      </h1>
      <div className="card border-pink-100 p-6">
        <div className="space-y-3">
          {periods.map((p, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium w-8">P{p.periodNumber || idx + 1}</span>
              <input type="time" value={p.startTime} onChange={e => handleChange(idx, 'startTime', e.target.value)} className="input-field w-32" />
              <span className="text-slate-400">to</span>
              <input type="time" value={p.endTime} onChange={e => handleChange(idx, 'endTime', e.target.value)} className="input-field w-32" />
              <select value={p.type} onChange={e => handleChange(idx, 'type', e.target.value)} className="input-field w-32">
                <option value="class">Class</option>
                <option value="assembly">Assembly</option>
                <option value="break">Break</option>
                <option value="lunch">Lunch</option>
              </select>
              <button onClick={() => handleRemove(idx)} className="text-red-500"><FiTrash2 /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleAddRow} className="btn-secondary flex items-center gap-1"><FiPlus /> Add Period</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-1">
            <FiSave /> {loading ? 'Saving...' : 'Save Timings'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SchoolTimings;