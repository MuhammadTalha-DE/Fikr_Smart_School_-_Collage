import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';

const RouteForm = ({ route, onClose, refresh }) => {
  const [form, setForm] = useState({
    name: '',
    stops: [{ location: '', order: 1, distanceFromStart: 0 }],
    totalDistance: 0,
    estimatedTime: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route) {
      setForm({
        name: route.name,
        stops: route.stops.length ? route.stops.map(s => ({ ...s })) : [{ location: '', order: 1, distanceFromStart: 0 }],
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        isActive: route.isActive,
      });
    }
  }, [route]);

  const addStop = () => {
    setForm(prev => ({
      ...prev,
      stops: [...prev.stops, { location: '', order: prev.stops.length + 1, distanceFromStart: 0 }],
    }));
  };

  const removeStop = (index) => {
    setForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...form.stops];
    updated[index][field] = field === 'order' || field === 'distanceFromStart' ? Number(value) : value;
    setForm({ ...form, stops: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.stops.length === 0) return toast.error('Name and at least one stop are required');
    setLoading(true);
    try {
      if (route) {
        await api.put(`/transport/routes/${route._id}`, form);
        toast.success('Route updated');
      } else {
        await api.post('/transport/routes', form);
        toast.success('Route created');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{route ? 'Edit Route' : 'New Route'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Route Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Distance (km)</label>
              <input type="number" value={form.totalDistance} onChange={e => setForm({...form, totalDistance: Number(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Est. Time (min)</label>
              <input type="number" value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: Number(e.target.value)})} className="input-field" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Stops</h3>
              <button type="button" onClick={addStop} className="text-blue-600 text-sm flex items-center gap-1"><FiPlus /> Add Stop</button>
            </div>
            {form.stops.map((stop, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                <input type="text" placeholder="Location" value={stop.location} onChange={e => handleStopChange(idx, 'location', e.target.value)} className="input-field flex-1" required />
                <input type="number" placeholder="Order" value={stop.order} onChange={e => handleStopChange(idx, 'order', e.target.value)} className="w-20 input-field" required />
                <input type="number" placeholder="Dist (km)" value={stop.distanceFromStart} onChange={e => handleStopChange(idx, 'distanceFromStart', e.target.value)} className="w-24 input-field" />
                <button type="button" onClick={() => removeStop(idx)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary bg-blue-600 text-white flex items-center gap-1">
              <FiSave /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteForm;