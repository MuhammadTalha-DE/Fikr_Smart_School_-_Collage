import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiSave, FiX } from 'react-icons/fi';

const VehicleForm = ({ vehicle, onClose, refresh }) => {
  const [form, setForm] = useState({
    registrationNumber: '',
    capacity: 1,
    driverName: '',
    driverContact: '',
    busType: 'School Bus',
    insuranceExpiry: '',
    fitnessExpiry: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({
        registrationNumber: vehicle.registrationNumber,
        capacity: vehicle.capacity,
        driverName: vehicle.driverName || '',
        driverContact: vehicle.driverContact || '',
        busType: vehicle.busType || 'School Bus',
        insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.slice(0, 10) : '',
        fitnessExpiry: vehicle.fitnessExpiry ? vehicle.fitnessExpiry.slice(0, 10) : '',
        isActive: vehicle.isActive ?? true,
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.registrationNumber || !form.capacity) return toast.error('Registration number and capacity are required');
    setLoading(true);
    try {
      if (vehicle) {
        await api.put(`/transport/vehicles/${vehicle._id}`, form);
        toast.success('Vehicle updated');
      } else {
        await api.post('/transport/vehicles', form);
        toast.success('Vehicle created');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{vehicle ? 'Edit Vehicle' : 'New Vehicle'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reg. Number *</label>
              <input type="text" value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity *</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver Name</label>
              <input type="text" value={form.driverName} onChange={e => setForm({...form, driverName: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver Contact</label>
              <input type="text" value={form.driverContact} onChange={e => setForm({...form, driverContact: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bus Type</label>
              <select value={form.busType} onChange={e => setForm({...form, busType: e.target.value})} className="input-field">
                <option>School Bus</option><option>Mini Bus</option><option>Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
              <input type="date" value={form.insuranceExpiry} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fitness Expiry</label>
              <input type="date" value={form.fitnessExpiry} onChange={e => setForm({...form, fitnessExpiry: e.target.value})} className="input-field" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
              <label className="text-sm font-medium">Active</label>
            </div>
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

export default VehicleForm;