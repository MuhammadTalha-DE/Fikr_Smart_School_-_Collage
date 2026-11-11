import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiHome, FiUser, FiUsers, FiArrowRight, FiTrash2, FiShuffle, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';

const HostelResidents = () => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHostels();
    fetchResidents();
  }, [selectedHostel]); // refetch when hostel filter changes

  const fetchHostels = async () => {
    try {
      const { data } = await api.get('/hostels');
      setHostels(data);
    } catch { /* ignore */ }
  };

 const fetchResidents = async () => {
  setLoading(true);
  setError('');
  try {
    const params = selectedHostel ? { hostelId: selectedHostel } : {};
    const { data } = await api.get('/hostel-residents', { params });
    setResidents(data);
  } catch (err) {
    setResidents([]);
    setError('Failed to load residents. Please check the console or try again.');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student from hostel?')) return;
    try {
      await api.delete(`/hostel-residents/${id}`);
      fetchResidents();
    } catch { /* ignore */ }
  };

  const filtered = residents.filter(r =>
    r.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-6 relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-indigo-400/30 rounded-full blur-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-extrabold text-white mb-8 flex items-center gap-3">
            <FiUsers className="text-indigo-400 w-10 h-10 animate-pulse" />
            Hostel Residents
          </motion.h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, admission number, class..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ WebkitTextFillColor: 'white' }}
              />
            </div>
            <select
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ WebkitTextFillColor: 'white' }}
            >
              <option value="">All Hostels</option>
              {hostels.map(h => (
                <option key={h._id} value={h._id} className="bg-gray-800">{h.name}</option>
              ))}
            </select>
          </div>

          {/* Residents Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No residents found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((resident, idx) => (
                <motion.div
                  key={resident._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, rotateY: 2 }}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl transform transition-all"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                      {resident.student.avatar ? (
                        <img src={resident.student.avatar} alt={resident.student.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="text-white text-2xl" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{resident.student.name}</h3>
                      <p className="text-gray-300 text-xs">Class {resident.student.class} | {resident.student.admissionNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <FiHome className="text-indigo-400" />
                      <span>{resident.hostel} – Room {resident.room}, Bed {resident.bed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiArrowRight className="text-green-400" />
                      <span>Joined {new Date(resident.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/admin/hostel-residents/${resident._id}`)}
                      className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm flex items-center justify-center gap-1 transition"
                    >
                      <FiEye /> View
                    </button>
                    <button
                      onClick={() => handleDelete(resident._id)}
                      className="py-2 px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition"
                      title="Remove from hostel"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Float animation keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default HostelResidents;