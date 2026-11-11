import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import RouteForm from '../../components/transport/RouteForm';
import VehicleForm from '../../components/transport/VehicleForm';

import  Avatar from '../../components/common/Avatar';
import  AvatarUpload from '../../components/common/AvatarUpload';
import AllocationForm from '../../components/transport/AllocationForm';

const Transport = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // 'route', 'vehicle', 'allocation'
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [routesRes, vehiclesRes, allocRes] = await Promise.all([
          api.get('/transport/routes'),
          api.get('/transport/vehicles'),
          api.get('/transport/allocations'),
        ]);
        setRoutes(routesRes.data.routes);
        setVehicles(vehiclesRes.data.vehicles);
        setAllocations(allocRes.data.allocations);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [routesRes, vehiclesRes, allocRes] = await Promise.all([
        api.get('/transport/routes'),
        api.get('/transport/vehicles'),
        api.get('/transport/allocations'),
      ]);
      setRoutes(routesRes.data.routes);
      setVehicles(vehiclesRes.data.vehicles);
      setAllocations(allocRes.data.allocations);
    } catch {
      toast.error('Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    try {
      await api.delete(`/transport/${type}/${id}`);
      toast.success(`${type.slice(0, -1)} deleted`);
      refresh();
    } catch { toast.error('Delete failed'); }
  };
  const handleChargeFee = async (allocationId) => {
  try {
    await api.post(`/transport/allocations/${allocationId}/charge-fee`);
    toast.success('Transport fee instalment added');
    refresh();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to charge fee');
  }
};

  const openCreate = (type) => { setEditingItem(null); setShowForm(type); };
  const openEdit = (type, item) => { setEditingItem(item); setShowForm(type); };
  const closeForm = () => setShowForm(null);

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🚌 Transport Management</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['routes', 'vehicles', 'allocations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Routes */}
        {activeTab === 'routes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Routes</h2>
              <button onClick={() => openCreate('routes')} className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <FiPlus /> Add Route
              </button>
            </div>
            {routes.length === 0 ? <p className="text-gray-500">No routes found.</p> : (
              <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Stops</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Distance</th>
                      <th className="px-4 py-3 text-center">Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {routes.map(route => (
                      <tr key={route._id}>
                        <td className="px-4 py-3 font-medium">{route.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{route.stops?.length || 0}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{route.totalDistance} km</td>
                        <td className="px-4 py-3 text-center">{route.isActive ? '✅' : '❌'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit('routes', route)} className="text-blue-600 mr-2"><FiEdit2 /></button>
                          <button onClick={() => handleDelete('routes', route._id)} className="text-red-600"><FiTrash2 /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vehicles */}
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Vehicles</h2>
              <button onClick={() => openCreate('vehicles')} className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <FiPlus /> Add Vehicle
              </button>
            </div>
            {vehicles.length === 0 ? <p className="text-gray-500">No vehicles found.</p> : (
              <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Reg. No</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Capacity</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Driver</th>
                      <th className="px-4 py-3 text-center">Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vehicles.map(v => (
                      <tr key={v._id}>
                        <td className="px-4 py-3 font-medium">{v.registrationNumber}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{v.capacity}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{v.driverName || '—'}</td>
                        <td className="px-4 py-3 text-center">{v.isActive ? '✅' : '❌'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit('vehicles', v)} className="text-blue-600 mr-2"><FiEdit2 /></button>
                          <button onClick={() => handleDelete('vehicles', v._id)} className="text-red-600"><FiTrash2 /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Allocations */}
       {activeTab === 'allocations' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Allocations</h2>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            if (!window.confirm('Charge fees for all active allocations with a monthly fee?')) return;
            try {
              await api.post('/transport/allocations/charge-all-fees');
              toast.success('Fees charged');
              refresh();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed');
            }
          }}
          className="btn-secondary text-sm"
        >
          Charge All Fees
        </button>
        <button
          onClick={() => openCreate('allocations')}
          className="btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <FiPlus /> Add Allocation
        </button>
      </div>
    </div>

    {allocations.length === 0 ? (
      <p className="text-gray-500">No allocations found.</p>
    ) : (
      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Route</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Vehicle</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Pickup Stop</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Monthly Fee</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-center">Charge</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allocations.map(alloc => (
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
                <td className="px-4 py-3 hidden md:table-cell">{alloc.vehicle?.registrationNumber}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="flex items-center gap-1">
                    <FiMapPin className="text-gray-400" /> {alloc.pickupStopName || alloc.pickupStop}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">PKR {alloc.monthlyFee || 0}</td>
                <td className="px-4 py-3 text-center">{alloc.isActive ? '✅' : '❌'}</td>
                <td className="px-4 py-3 text-center">
                  {alloc.monthlyFee > 0 && alloc.isActive && (
                    <button
                      onClick={() => handleChargeFee(alloc._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Charge Fee
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => openEdit('allocations', alloc)} className="text-blue-600 mr-2">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete('allocations', alloc._id)} className="text-red-600">
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

        {/* Modals */}
        {showForm === 'routes' && <RouteForm route={editingItem} onClose={closeForm} refresh={refresh} />}
        {showForm === 'vehicles' && <VehicleForm vehicle={editingItem} onClose={closeForm} refresh={refresh} />}
        {showForm === 'allocations' && (
          <AllocationForm
            allocation={editingItem}
            routes={routes}
            vehicles={vehicles}
            onClose={closeForm}
            refresh={refresh}
          />
        )}
      </div>
    </Layout>
  );
};

export default Transport;