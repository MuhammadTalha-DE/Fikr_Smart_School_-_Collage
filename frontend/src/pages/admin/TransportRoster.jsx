import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiDownload, FiMapPin, FiTruck, FiUser } from 'react-icons/fi';
import Select from 'react-select';
import { generateTripSheetPDF } from '../../utils/generateTripSheetPDF';
import  AvatarUpload from '../../components/common/AvatarUpload';
import AllocationForm from '../../components/transport/AllocationForm';

const TransportRoster = () => {
  const { user } = useAuth();
  const [roster, setRoster] = useState([]);
  const [tripSheetData, setTripSheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeFilter, setRouteFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    // Load routes and vehicles for filter dropdowns
    const fetchFilters = async () => {
      try {
        const [rRes, vRes] = await Promise.all([
          api.get('/transport/routes'),
          api.get('/transport/vehicles'),
        ]);
        setRoutes(rRes.data.routes || []);
        setVehicles(vRes.data.vehicles || []);
      } catch (err) { /* ignore */ }
    };
    fetchFilters();
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const params = {};
      if (routeFilter) params.route = routeFilter;
      if (vehicleFilter) params.vehicle = vehicleFilter;
      const { data } = await api.get('/transport/roster', { params });
      setRoster(data.roster);
    } catch {
      toast.error('Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchTripSheetData = async (vehicleId = '') => {
    try {
      const params = {};
      if (vehicleId) {
        params.vehicle = vehicleId;
      } else if (vehicleFilter) {
        params.vehicle = vehicleFilter;
      } else if (routeFilter) {
        params.route = routeFilter;
      }
      const { data } = await api.get('/transport/trip-sheet', { params });
      setTripSheetData(data.tripSheet);
    } catch {
      toast.error('Failed to load trip sheet data');
    }
  };

  const handleGeneratePDF = async () => {
    await fetchTripSheetData(vehicleFilter);
    // After data is loaded, generate PDF (will run in useEffect or we can call directly)
    // We'll use a delayed approach: fetch then generate.
    // Better: fetch and then in .then() generate.
    try {
      const params = {};
      if (vehicleFilter) params.vehicle = vehicleFilter;
      else if (routeFilter) params.route = routeFilter;
      const { data } = await api.get('/transport/trip-sheet', { params });
      generateTripSheetPDF(data.tripSheet, vehicleFilter || null);
    } catch {
      toast.error('Failed to generate trip sheet');
    }
  };

  const routeOptions = routes.map(r => ({ value: r._id, label: r.name }));
  const vehicleOptions = vehicles.map(v => ({ value: v._id, label: `${v.registrationNumber} (${v.driverName || 'No driver'})` }));

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">🚌 Transport Roster</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-56">
            <label className="block text-sm font-medium mb-1">Filter by Route</label>
            <Select
              options={routeOptions}
              isClearable
              value={routeOptions.find(o => o.value === routeFilter) || null}
              onChange={(opt) => {
                setRouteFilter(opt?.value || '');
                setVehicleFilter(''); // clear vehicle when route changes
              }}
              placeholder="All Routes"
            />
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium mb-1">Filter by Vehicle</label>
            <Select
              options={vehicleOptions}
              isClearable
              value={vehicleOptions.find(o => o.value === vehicleFilter) || null}
              onChange={(opt) => setVehicleFilter(opt?.value || '')}
              placeholder="All Vehicles"
            />
          </div>
          <button onClick={fetchRoster} className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl">
            Load Roster
          </button>
          <button onClick={handleGeneratePDF} className="btn-secondary flex items-center gap-2">
            <FiDownload /> Download Trip Sheet PDF
          </button>
        </div>

        {/* Roster Table */}
        {loading ? (
          <p className="text-gray-500 py-8 text-center">Loading…</p>
        ) : roster.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No allocations found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Route</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Vehicle</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Pickup Stop</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((alloc) => (
                  <tr key={alloc._id}>
                    <td className="px-4 py-3">
  <div className="flex items-center gap-3">
    <Avatar
      src={alloc.student?.userId?.avatar}
      name={alloc.student?.userId?.name || alloc.student?.admissionNumber}
      size="w-8 h-8"
    />
    <span className="font-medium">
      {alloc.student?.userId?.name || alloc.student?.admissionNumber}
    </span>
  </div>
</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{alloc.route?.name}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <FiTruck className="inline mr-1 text-gray-400" />
                      {alloc.vehicle?.registrationNumber}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <FiMapPin className="inline mr-1 text-gray-400" />
                      {alloc.pickupStopName || alloc.pickupStop}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransportRoster;