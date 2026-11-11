import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiArrowLeft, FiUser, FiHome, FiCalendar, FiDollarSign, FiAlertCircle, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const StudentHostelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/hostel-residents/${id}`);
        setDetail(data);
      } catch {
        navigate('/admin/hostel-residents');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-6">
          <div className="animate-pulse max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-64 bg-white/10 rounded-lg" />
            <div className="h-64 bg-white/10 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!detail) return null;

  const { resident, attendance, leaves, visitors, complaints, feeAccount } = detail;

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-6 relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
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

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/admin/hostel-residents')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <FiArrowLeft /> Back to Residents
          </button>

          {/* Student Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-xl">
                {resident.studentId?.userId?.avatar ? (
                  <img src={resident.studentId.userId.avatar} alt={resident.studentId.userId.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-white text-4xl" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{resident.studentId?.userId?.name || 'Unknown'}</h1>
                <p className="text-gray-300 mt-1">
                  Class {resident.studentId?.classId?.name || 'N/A'} | Admission No: {resident.studentId?.admissionNumber || 'N/A'}
                </p>
                <p className="text-gray-400 text-sm">
                  {resident.hostelId?.name} – Room {resident.roomId?.roomNumber}, Bed {resident.bedId?.bedNumber}
                </p>
                <p className="text-gray-500 text-xs mt-1">Joined: {new Date(resident.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['overview', 'attendance', 'leaves', 'visitors', 'complaints', 'fees'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <FiCalendar className="text-indigo-400 w-6 h-6 mb-2" />
                <p className="text-2xl font-bold text-white">{attendance.total}</p>
                <p className="text-xs text-gray-400">Attendance Records</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <FiAlertCircle className="text-red-400 w-6 h-6 mb-2" />
                <p className="text-2xl font-bold text-white">{complaints.length}</p>
                <p className="text-xs text-gray-400">Complaints</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <FiUsers className="text-green-400 w-6 h-6 mb-2" />
                <p className="text-2xl font-bold text-white">{visitors.length}</p>
                <p className="text-xs text-gray-400">Visitors</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <FiClock className="text-amber-400 w-6 h-6 mb-2" />
                <p className="text-2xl font-bold text-white">{leaves.length}</p>
                <p className="text-xs text-gray-400">Leaves</p>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent Attendance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-400">{attendance.present}</p>
                  <p className="text-xs text-gray-300">Present</p>
                </div>
                <div className="p-4 bg-red-500/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-400">{attendance.absent}</p>
                  <p className="text-xs text-gray-300">Absent</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Leave Requests</h3>
              {leaves.length === 0 ? <p className="text-gray-400">No leaves yet.</p> : (
                <div className="space-y-2">
                  {leaves.map(l => (
                    <div key={l._id} className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm capitalize">{l.leaveType}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        l.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        l.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'visitors' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Visitor Log</h3>
              {visitors.length === 0 ? <p className="text-gray-400">No visitors yet.</p> : (
                <div className="space-y-2">
                  {visitors.map(v => (
                    <div key={v._id} className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm">{v.visitorName} ({v.relation})</p>
                        <p className="text-xs text-gray-400">{v.purpose}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        v.status === 'checked_out' ? 'bg-green-500/20 text-green-400' :
                        v.status === 'checked_in' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>{v.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Complaints</h3>
              {complaints.length === 0 ? <p className="text-gray-400">No complaints yet.</p> : (
                <div className="space-y-2">
                  {complaints.map(c => (
                    <div key={c._id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between">
                        <p className="text-white text-sm capitalize">{c.category}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          c.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          c.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                        }`}>{c.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Hostel Fee Status</h3>
              {!feeAccount ? <p className="text-gray-400">No hostel fee account found.</p> : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white">Total</span>
                    <span className="text-white font-bold">PKR {feeAccount.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Paid</span>
                    <span className="text-green-400 font-bold">PKR {feeAccount.paidAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Due</span>
                    <span className="text-red-400 font-bold">PKR {feeAccount.dueAmount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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

export default StudentHostelDetail;