import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiHome, FiGrid, FiUsers,
  FiCheck, FiX, FiSearch, FiAlertCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const HostelManagement = () => {
  // ─── Data states ────────────────────────────────
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [wardens, setWardens] = useState([]);

  // ─── Form states ────────────────────────────────
  const [activeTab, setActiveTab] = useState('hostels');
  const [hostelForm, setHostelForm] = useState({
    name: '', type: 'boys', capacity: 0, wardenId: '', address: '',
  });
  const [roomForm, setRoomForm] = useState({
    hostelId: '', roomNumber: '', floor: '', capacity: 2, roomType: 'double',
  });

  // ─── Application actions ─────────────────────────
  const [selectedBed, setSelectedBed] = useState('');

  // ─── Fetch all data on mount ─────────────────────
  useEffect(() => {
    fetchHostels();
    fetchWardens();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (hostels.length > 0) {
      fetchRooms();
      fetchBeds();
    }
  }, [hostels]);

  const fetchHostels = async () => {
    try { const { data } = await api.get('/hostels'); setHostels(data); } catch { toast.error('Failed to load hostels'); }
  };

  const fetchWardens = async () => {
    try { const { data } = await api.get('/users/wardens'); setWardens(data || []); }
    catch { const all = await api.get('/users'); setWardens(all.data.filter(u => u.role === 'warden')); }
  };

  const fetchRooms = async () => {
    try { const { data } = await api.get('/hostels/rooms'); setRooms(data); } catch { /* ignore */ }
  };

  const fetchBeds = async () => {
    try { const { data } = await api.get('/hostels/beds'); setBeds(data); } catch { /* ignore */ }
  };

  const fetchApplications = async () => {
    try { const { data } = await api.get('/hostel-applications'); setApplications(data); } catch { /* ignore */ }
  };

  // ─── Hostel CRUD ─────────────────────────────────
  const handleCreateHostel = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...hostelForm, wardenId: hostelForm.wardenId || null };
      await api.post('/hostels', payload);
      toast.success('Hostel created');
      fetchHostels();
      setHostelForm({ name: '', type: 'boys', capacity: 0, wardenId: '', address: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteHostel = async (id) => {
    if (!window.confirm('Delete hostel and all its rooms?')) return;
    try { await api.delete(`/hostels/${id}`); toast.success('Hostel deleted'); fetchHostels(); } catch { toast.error('Failed'); }
  };

  // ─── Room CRUD ───────────────────────────────────
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostels/rooms', { ...roomForm, floor: Number(roomForm.floor), capacity: Number(roomForm.capacity) });
      toast.success('Room created – beds auto‑generated');
      fetchRooms(); fetchBeds();
      setRoomForm({ hostelId: '', roomNumber: '', floor: '', capacity: 2, roomType: 'double' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete room and its beds?')) return;
    try { await api.delete(`/hostels/rooms/${id}`); toast.success('Room deleted'); fetchRooms(); fetchBeds(); } catch { toast.error('Failed'); }
  };

  // ─── Application management ──────────────────────
  const handleApproveApplication = async (appId) => {
    if (!selectedBed) return toast.error('Select a bed first');
    try {
      await api.put(`/hostel-applications/${appId}/approve`, { bedId: selectedBed });
      toast.success('Application approved');
      fetchApplications(); fetchBeds(); setSelectedBed('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRejectApplication = async (appId) => {
    const reason = prompt('Rejection reason (optional):');
    if (!reason && reason !== '') return;
    try { await api.put(`/hostel-applications/${appId}/reject`, { rejectionReason: reason || '' }); toast.success('Application rejected'); fetchApplications(); }
    catch { toast.error('Failed'); }
  };

  // ─── Tabs definition ─────────────────────────────
  const tabs = [
    { key: 'hostels', label: 'Hostels', icon: FiHome, color: 'from-indigo-500 to-blue-600' },
    { key: 'rooms', label: 'Rooms & Beds', icon: FiGrid, color: 'from-emerald-500 to-teal-600' },
    { key: 'applications', label: 'Applications', icon: FiUsers, color: 'from-amber-500 to-orange-600' },
  ];

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  // ─── Shared Input Styles ─────────────────────────
  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm";

  const selectClass = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent transition-all text-sm appearance-none cursor-pointer";

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0d1321] p-4 md:p-6 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-extrabold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FiHome className="text-white text-xl" />
              </div>
              Hostel Management
            </motion.h1>
            <p className="text-gray-400 mt-2 ml-1">Manage hostels, rooms, beds, and student applications</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'applications' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Hostels Tab ──────────────────────────────────── */}
          {activeTab === 'hostels' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Create Form */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full" /> Create New Hostel
                </h2>
                <form onSubmit={handleCreateHostel}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Hostel Name *</label>
                      <input type="text" placeholder="e.g., Boys Hostel A" value={hostelForm.name}
                        onChange={e => setHostelForm({...hostelForm, name: e.target.value})} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Type *</label>
                      <select value={hostelForm.type}
                        onChange={e => setHostelForm({...hostelForm, type: e.target.value})} className={selectClass}
                        style={{ WebkitTextFillColor: 'white', color: 'white', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}>
                        <option value="boys" className="bg-gray-800 text-white">Boys</option>
                        <option value="girls" className="bg-gray-800 text-white">Girls</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Capacity *</label>
                      <input type="number" placeholder="Total beds" value={hostelForm.capacity}
                        onChange={e => setHostelForm({...hostelForm, capacity: Number(e.target.value)})} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Warden</label>
                      <select value={hostelForm.wardenId}
                        onChange={e => setHostelForm({...hostelForm, wardenId: e.target.value})} className={selectClass}
                        style={{ WebkitTextFillColor: 'white', color: 'white', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}>
                        <option value="" className="bg-gray-800 text-white">Assign later (optional)</option>
                        {wardens.map(w => (
                          <option key={w._id} value={w._id} className="bg-gray-800 text-white">{w.name || w.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Address</label>
                      <input type="text" placeholder="Building location" value={hostelForm.address}
                        onChange={e => setHostelForm({...hostelForm, address: e.target.value})} className={inputClass} />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                    <FiPlus /> Create Hostel
                  </button>
                </form>
              </div>

              {/* Hostel List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Existing Hostels ({hostels.length})</h3>
                {hostels.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <FiHome className="text-gray-600 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500">No hostels created yet</p>
                  </div>
                ) : (
                  hostels.map(h => (
                    <motion.div key={h._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex justify-between items-center hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <FiHome className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{h.name}</h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            <span className="capitalize">{h.type}</span> · Capacity: {h.capacity} · Warden: <span className="text-indigo-400">{h.wardenId?.name || 'Unassigned'}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteHostel(h._id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-500/10">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Rooms & Beds Tab ─────────────────────────────── */}
          {activeTab === 'rooms' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Create Room Form */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-emerald-500 rounded-full" /> Create New Room
                </h2>
                <form onSubmit={handleCreateRoom}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Hostel *</label>
                      <select value={roomForm.hostelId}
                        onChange={e => setRoomForm({...roomForm, hostelId: e.target.value})} className={selectClass} required
                        style={{ WebkitTextFillColor: 'white', color: 'white', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}>
                        <option value="" className="bg-gray-800 text-white">Select Hostel</option>
                        {hostels.map(h => <option key={h._id} value={h._id} className="bg-gray-800 text-white">{h.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Room Number *</label>
                      <input type="text" placeholder="e.g., 101" value={roomForm.roomNumber}
                        onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Floor *</label>
                      <input type="number" placeholder="e.g., 1" value={roomForm.floor}
                        onChange={e => setRoomForm({...roomForm, floor: Number(e.target.value)})} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Capacity (beds) *</label>
                      <input type="number" placeholder="e.g., 4" value={roomForm.capacity}
                        onChange={e => setRoomForm({...roomForm, capacity: Number(e.target.value)})} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 ml-1">Room Type</label>
                      <select value={roomForm.roomType}
                        onChange={e => setRoomForm({...roomForm, roomType: e.target.value})} className={selectClass}
                        style={{ WebkitTextFillColor: 'white', color: 'white', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}>
                        <option value="single" className="bg-gray-800 text-white">Single</option>
                        <option value="double" className="bg-gray-800 text-white">Double</option>
                        <option value="triple" className="bg-gray-800 text-white">Triple</option>
                        <option value="dormitory" className="bg-gray-800 text-white">Dormitory</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                    <FiPlus /> Create Room
                  </button>
                </form>
              </div>

              {/* Rooms List */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Rooms & Occupancy</h3>
                {hostels.map(hostel => {
                  const hostelRooms = rooms.filter(r => r.hostelId === hostel._id);
                  if (hostelRooms.length === 0) return null;
                  return (
                    <div key={hostel._id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
                      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> {hostel.name}
                      </h3>
                      <div className="grid gap-2">
                        {hostelRooms.map(room => (
                          <div key={room._id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                {room.roomNumber}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">Room {room.roomNumber} <span className="text-gray-500 text-xs">· Floor {room.floor}</span></p>
                                <p className="text-gray-500 text-xs">
                                  {room.roomType} · {room.capacity} beds · {room.occupiedBeds}/{room.capacity} occupied
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteRoom(room._id)}
                              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-500/10">
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── Applications Tab ─────────────────────────────── */}
          {activeTab === 'applications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-500 rounded-full" /> Pending Applications
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                      {pendingCount} pending
                    </span>
                  )}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 text-left font-medium">Student</th>
                        <th className="p-3 text-left font-medium">Reason</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(a => a.status === 'pending').map(app => (
                        <motion.tr key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                                {app.studentId?.userId?.name?.charAt(0) || '?'}
                              </div>
                              {app.studentId?.userId?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 text-gray-400 text-xs max-w-[200px] truncate">{app.reason || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 font-medium">Pending</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <select value={selectedBed}
                                onChange={e => setSelectedBed(e.target.value)}
                                className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:ring-2 focus:ring-indigo-400 min-w-[140px]"
                                style={{ WebkitTextFillColor: 'white', color: 'white' }}>
                                <option value="" className="bg-gray-800 text-white">Select bed</option>
                                {beds.filter(b => b.status === 'vacant').map(bed => (
                                  <option key={bed._id} value={bed._id} className="bg-gray-800 text-white">
                                    Room {bed.roomId?.roomNumber} – Bed {bed.bedNumber}
                                  </option>
                                ))}
                              </select>
                              <button onClick={() => handleApproveApplication(app._id)}
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors" title="Approve">
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleRejectApplication(app._id)}
                                className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors" title="Reject">
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {pendingCount === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center">
                            <FiUsers className="text-gray-600 text-3xl mx-auto mb-2" />
                            <p className="text-gray-500">No pending applications</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HostelManagement;