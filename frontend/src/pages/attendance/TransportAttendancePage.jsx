import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import AttendanceStatsCard from '../../components/attendance/AttendanceStatsCard';
import { FiTruck, FiUserCheck, FiUserX, FiClock, FiMapPin } from 'react-icons/fi';
import {
  markTransportAttendance,
  getTransportAttendance,
  getTransportAttendanceStats,
} from '../../services/attendanceApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TransportAttendancePage = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripType, setTripType] = useState('morning_pickup'); // morning_pickup | evening_drop
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedRoute && selectedVehicle) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [selectedRoute, selectedVehicle, date, tripType]);

  const fetchRoutes = async () => {
    try {
      const { data } = await api.get('/transport/routes');
      const routeList = Array.isArray(data) ? data : data?.routes || [];
      setRoutes(routeList);
      if (routeList.length > 0) setSelectedRoute(routeList[0]._id);
    } catch (error) {
      toast.error('Failed to load routes');
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/transport/vehicles');
      const vehicleList = Array.isArray(data) ? data : data?.vehicles || [];
      setVehicles(vehicleList);
      if (vehicleList.length > 0) setSelectedVehicle(vehicleList[0]._id);
    } catch (error) {
      toast.error('Failed to load vehicles');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/transport/allocations?route=${selectedRoute}&vehicle=${selectedVehicle}&isActive=true`
      );
      const allocations = Array.isArray(data) ? data : data?.allocations || [];
      setStudents(allocations);
      const init = {};
      allocations.forEach((a) => {
        const studentId = a.student?._id || a.student;
        init[studentId] = { boarded: false, dropped: false };
      });
      setAttendance((prev) => ({ ...init, ...prev }));
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data } = await getTransportAttendance({
        routeId: selectedRoute,
        vehicleId: selectedVehicle,
        date,
      });
      const existing = {};
      data.forEach((rec) => {
        existing[rec.studentId?._id] = {
          boarded: rec.boarded,
          dropped: rec.dropped,
        };
      });
      setAttendance((prev) => ({ ...prev, ...existing }));
    } catch (error) {
      // No existing records
    }
  };

  const toggleStatus = (studentId, field) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: !prev[studentId]?.[field],
      },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance)
        .filter(([studentId]) => {
          const allocation = students.find(
            (a) => (a.student?._id || a.student) === studentId
          );
          return allocation;
        })
        .map(([studentId, status]) => {
          const allocation = students.find(
            (a) => (a.student?._id || a.student) === studentId
          );
          return {
            studentId,
            routeId: selectedRoute,
            vehicleId: selectedVehicle,
            date,
            tripType: tripType === 'morning_pickup' ? 'morning_pickup' : 'evening_drop',
            boarded: status.boarded,
            dropped: status.dropped,
            boardedTime: status.boarded ? new Date().toISOString() : null,
            droppedTime: status.dropped ? new Date().toISOString() : null,
          };
        });

      await markTransportAttendance({ records });
      toast.success('Transport attendance saved!');
    } catch (error) {
      toast.error('Failed to save transport attendance');
    } finally {
      setSaving(false);
    }
  };

  const boardedCount = Object.values(attendance).filter((s) => s.boarded).length;
  const droppedCount = Object.values(attendance).filter((s) => s.dropped).length;

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Transport Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track student boarding and drop-off
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Vehicle
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber || v.vehicleNumber}
                    {v.model ? ` (${v.model})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Trip
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTripType('morning_pickup')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    tripType === 'morning_pickup'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  🚌 Pickup
                </button>
                <button
                  onClick={() => setTripType('evening_drop')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    tripType === 'evening_drop'
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  🏠 Drop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AttendanceStatsCard
            title="Total Students"
            value={students.length}
            icon={FiTruck}
            color="blue"
          />
          <AttendanceStatsCard
            title="Boarded"
            value={boardedCount}
            icon={FiUserCheck}
            color="green"
            percentage={
              students.length > 0
                ? Math.round((boardedCount / students.length) * 100)
                : 0
            }
          />
          <AttendanceStatsCard
            title="Not Boarded"
            value={students.length - boardedCount}
            icon={FiUserX}
            color="red"
          />
          <AttendanceStatsCard
            title={`${tripType === 'morning_pickup' ? 'Dropped' : 'Picked'}`}
            value={droppedCount}
            icon={FiMapPin}
            color="purple"
          />
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Students on Route
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-2">
              {students.map((allocation) => {
                const studentId = allocation.student?._id || allocation.student;
                const status = attendance[studentId] || { boarded: false, dropped: false };

                return (
                  <div
                    key={allocation._id}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                        {allocation.student?.userId?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {allocation.student?.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Stop #{allocation.pickupStop || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={status.boarded}
                          onChange={() => toggleStatus(studentId, 'boarded')}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-600">Boarded</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={status.dropped}
                          onChange={() => toggleStatus(studentId, 'dropped')}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Dropped</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">
              No students allocated to this route/vehicle
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving || !students.length}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Transport Attendance'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransportAttendancePage;
