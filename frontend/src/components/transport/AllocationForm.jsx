import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Select from 'react-select';
import { FiSave, FiX } from 'react-icons/fi';

const AllocationForm = ({ allocation, routes, vehicles, onClose, refresh }) => {
  const [form, setForm] = useState({
    student: '',
    route: '',
    vehicle: '',
    pickupStop: '',
    monthlyFee: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);   // full route object to get stops

  useEffect(() => {
    // Pre‑fill if editing
    if (allocation) {
      setForm({
        student: allocation.student?._id || allocation.student,
        route: allocation.route?._id || allocation.route,
        vehicle: allocation.vehicle?._id || allocation.vehicle,
        monthlyFee: allocation?.monthlyFee || 0,
        pickupStop: allocation.pickupStop ?? '',
        startDate: allocation.startDate ? allocation.startDate.slice(0, 10) : '',
        endDate: allocation.endDate ? allocation.endDate.slice(0, 10) : '',
        isActive: allocation.isActive ?? true,
      });
      // Load the route object to show stops
      const route = routes.find(r => r._id === (allocation.route?._id || allocation.route));
      if (route) setSelectedRoute(route);
    }

    // Fetch students (only name and id)
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/students');   // might need to restrict fields
        // Assume data is array of { _id, userId: { name } }
        const list = (data.students || data).map(s => ({
          value: s._id,
          label: s.userId?.name || 'Unknown',
        }));
        setStudents(list);
      } catch { setStudents([]); }
    };
    fetchStudents();
  }, [allocation, routes]);

  useEffect(() => {
    if (form.route) {
      const route = routes.find(r => r._id === form.route);
      setSelectedRoute(route || null);
      // Reset pickup stop if route changed and the previous stop is no longer valid
      if (route && !route.stops.some(s => s.order === form.pickupStop)) {
        setForm(prev => ({ ...prev, pickupStop: '' }));
      }
    } else {
      setSelectedRoute(null);
      setForm(prev => ({ ...prev, pickupStop: '' }));
    }
  }, [form.route, routes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student || !form.route || !form.vehicle || form.pickupStop === '') {
      return toast.error('All fields are required');
    }
    setLoading(true);
    try {
      if (allocation) {
        await api.put(`/transport/allocations/${allocation._id}`, form);
        toast.success('Allocation updated');
      } else {
        await api.post('/transport/allocations', form);
        toast.success('Allocation created');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  const studentOptions = students;
  const routeOptions = routes.map(r => ({ value: r._id, label: r.name }));
  const vehicleOptions = vehicles.map(v => ({ value: v._id, label: `${v.registrationNumber} (${v.capacity} seats)` }));
  const stopOptions = selectedRoute
    ? selectedRoute.stops.map(s => ({ value: s.order, label: `${s.order}. ${s.location}` }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{allocation ? 'Edit Allocation' : 'New Allocation'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <Select
              options={studentOptions}
              value={studentOptions.find(o => o.value === form.student) || null}
              onChange={opt => setForm({...form, student: opt?.value || ''})}
              placeholder="Search student..."
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Route *</label>
            <Select
              options={routeOptions}
              value={routeOptions.find(o => o.value === form.route) || null}
              onChange={opt => setForm({...form, route: opt?.value || ''})}
              placeholder="Select route..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vehicle *</label>
            <Select
              options={vehicleOptions}
              value={vehicleOptions.find(o => o.value === form.vehicle) || null}
              onChange={opt => setForm({...form, vehicle: opt?.value || ''})}
              placeholder="Select vehicle..."
            />
          </div>
          {selectedRoute && (
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Stop *</label>
              <Select
                options={stopOptions}
                value={stopOptions.find(o => o.value === form.pickupStop) || null}
                onChange={opt => setForm({...form, pickupStop: opt?.value !== undefined ? opt.value : ''})}
                placeholder="Select stop..."
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="input-field" placeholder="Leave empty for ongoing" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
            <label className="text-sm font-medium">Active</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary bg-blue-600 text-white flex items-center gap-1">
              <FiSave /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div>
  <label className="block text-sm font-medium mb-1">Monthly Fee</label>
  <input
    type="number"
    min="0"
    step="0.01"
    value={form.monthlyFee}
    onChange={e => setForm({...form, monthlyFee: parseFloat(e.target.value) || 0})}
    className="input-field"
  />
</div>
        </form>
      </div>
    </div>
  );
};

export default AllocationForm;