import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiAlertCircle, FiFilter, FiSearch, FiZap, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons = {
  electrical: '⚡',
  plumbing: '🚿',
  furniture: '🪑',
  cleanliness: '🧹',
  other: '📦',
};

const statusActions = [
  { value: 'in_progress', label: 'Start Progress', icon: FiClock, color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolve', icon: FiCheckCircle, color: 'bg-green-500' },
];

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [resolutionNote, setResolutionNote] = useState({});

  useEffect(() => { fetchComplaints(); }, [filter]);

  const fetchComplaints = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      const { data } = await api.get('/hostel-complaints', { params });
      setComplaints(data);
    } catch (err) { toast.error('Failed to load complaints'); }
  };

  const handleStatusUpdate = async (id, newStatus, note = '') => {
    try {
      await api.put(`/hostel-complaints/${id}`, { status: newStatus, resolutionNote: note });
      toast.success(`Complaint ${newStatus}`);
      fetchComplaints();
    } catch (err) { toast.error('Update failed'); }
  };

  return (
    <Layout role="warden">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-black p-6 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-purple-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${10 + Math.random() * 40}px`,
                height: `${10 + Math.random() * 40}px`,
              }}
              animate={{ y: [0, -30, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-extrabold text-white flex items-center justify-center gap-3">
              <FiZap className="text-purple-400 w-10 h-10 animate-pulse" />
              Complaint Management
            </h1>
            <p className="text-purple-200 mt-2">Monitor and resolve student complaints</p>
          </motion.div>

          {/* Filter Bar with 3D card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center gap-2 text-white">
              <FiFilter className="text-purple-400" />
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="bg-white/5 border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-white">
              <FiSearch className="text-purple-400" />
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="bg-white/5 border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryIcons).map(cat => (
                  <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Complaints Table with 3D hover effects */}
          <div className="space-y-3">
            <AnimatePresence>
              {complaints.map((complaint, index) => (
                <motion.div
                  key={complaint._id}
                  initial={{ opacity: 0, x: -20, rotateY: 5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.03, type: 'spring' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transform transition-all"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{categoryIcons[complaint.category]}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold capitalize">{complaint.category}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          complaint.priority === 'high' ? 'bg-red-500' : complaint.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        } text-white`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{complaint.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <FiUser className="text-gray-400 w-3 h-3" />
                        <span className="text-xs text-gray-400">
                          {complaint.hostelStudentId?.studentId?.userId?.name || 'Unknown Student'} • {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      complaint.status === 'open' ? 'bg-red-100 text-red-700' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {complaint.status === 'open' ? <FiAlertCircle /> : complaint.status === 'in_progress' ? <FiClock /> : <FiCheckCircle />}
                      {complaint.status.replace('_', ' ')}
                    </span>
                    {complaint.status !== 'resolved' && (
                      <div className="flex gap-2">
                        {statusActions.map(action => {
                          const Icon = action.icon;
                          return (
                            <motion.button
                              key={action.value}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (action.value === 'resolved') {
                                  const note = prompt('Resolution note (optional):');
                                  handleStatusUpdate(complaint._id, action.value, note || '');
                                } else {
                                  handleStatusUpdate(complaint._id, action.value);
                                }
                              }}
                              className={`${action.color} text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all`}
                              title={action.label}
                            >
                              <Icon className="w-4 h-4" />
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                    {complaint.status === 'resolved' && complaint.resolutionNote && (
                      <p className="text-xs text-green-300 max-w-xs italic">{complaint.resolutionNote}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {complaints.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-white/70 bg-white/5 rounded-2xl">
                No complaints match filters.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComplaintManagement;