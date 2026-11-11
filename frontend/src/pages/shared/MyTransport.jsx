import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { FiMapPin, FiClock, FiTruck } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';   // ← new

const MyTransport = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [allocation, setAllocation] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);

  useEffect(() => {
    // Fetch current allocation for the student (or parent's child)
    const fetchAllocation = async () => {
      try {
        const { data } = await api.get('/transport/my-allocation');
        setAllocation(data.allocation);
        // If allocation has a vehicle, fetch its latest location
        if (data.allocation?.vehicle) {
          const { data: vData } = await api.get(`/transport/vehicles/${data.allocation.vehicle._id}`);
          setVehicleLocation(vData.vehicle?.currentLocation);
        }
      } catch {
        /* no allocation */
      }
    };
    fetchAllocation();

    // Listen for socket updates
    if (socket && allocation?.vehicle?._id) {
      socket.emit('join-vehicle-room', allocation.vehicle._id);
      socket.on('vehicle-location-update', (data) => {
        if (data.vehicleId === allocation.vehicle._id) {
          setVehicleLocation({
            coordinates: [data.lng, data.lat],
            lastUpdated: data.timestamp,
          });
        }
      });
      return () => {
        socket.emit('leave-vehicle-room', allocation.vehicle._id);
        socket.off('vehicle-location-update');
      };
    }
  }, [socket, allocation?.vehicle?._id]);

  if (!allocation) {
    return (
      <Layout role={user?.role}>
        <div className="p-6 text-center text-gray-500">
          <FiTruck className="mx-auto text-4xl text-gray-300 mb-2" />
          <p>No transport allocation found.</p>
          <p className="text-sm mt-1">You are not assigned to any school bus route.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role={user?.role}>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🚌 My Transport</h1>

        {/* Student Info with Avatar */}
        <div className="flex items-center gap-4 mb-6 bg-white rounded-xl p-4 shadow-sm border">
          <Avatar
            src={allocation.student?.userId?.avatar}
            name={allocation.student?.userId?.name || allocation.student?.admissionNumber}
            size="w-14 h-14"
          />
          <div>
            <p className="font-bold text-lg text-gray-900">
              {allocation.student?.userId?.name}
            </p>
            <p className="text-sm text-gray-500">
              Admission No: {allocation.student?.admissionNumber || '—'}
            </p>
          </div>
        </div>

        {/* Allocation Details */}
        <div className="bg-white rounded-xl p-5 shadow-sm border space-y-3">
          <h2 className="font-semibold text-gray-800">Assigned Bus Details</h2>
          <p>
            <strong>Route:</strong> {allocation.route?.name}
          </p>
          <p>
            <strong>Vehicle:</strong> {allocation.vehicle?.registrationNumber}
          </p>
          <p>
            <strong>Driver:</strong> {allocation.vehicle?.driverName || '—'}
          </p>
          <p>
            <strong>Contact:</strong> {allocation.vehicle?.driverContact || '—'}
          </p>
          <p>
            <strong>Pickup Stop:</strong>{' '}
            {allocation.pickupStopName || allocation.pickupStop}
          </p>
        </div>

        {/* Live Location */}
        {vehicleLocation && (
          <div className="bg-white rounded-xl p-5 shadow-sm border mt-4">
            <h2 className="font-semibold text-gray-800 mb-2">Live Bus Location</h2>
            <p className="text-sm text-gray-600">
              <FiMapPin className="inline mr-1 text-blue-500" />
              {vehicleLocation.coordinates[1]?.toFixed(5)},{' '}
              {vehicleLocation.coordinates[0]?.toFixed(5)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <FiClock className="inline mr-1" />
              Last updated:{' '}
              {vehicleLocation.lastUpdated
                ? new Date(vehicleLocation.lastUpdated).toLocaleTimeString()
                : '—'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTransport;
