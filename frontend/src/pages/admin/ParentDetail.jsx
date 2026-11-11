import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSave, FiArrowLeft, FiUser, FiUsers, FiPlus, FiTrash2,
  FiSearch, FiX, FiEdit2
} from 'react-icons/fi';
import Select from 'react-select';

const ParentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchParent();
    fetchAvailableStudents();
  }, [id]);

  const fetchParent = async () => {
    try {
      // Ensure we use the correct endpoint: /api/parents/:id
      const { data } = await api.get(`/parents/${id}`);
      setParent(data);
      setForm({ name: data.userId?.name || '', email: data.userId?.email || '' });
      setSelectedChildren(data.children?.map(c => c._id) || []);
    } catch (error) {
      toast.error('Failed to load parent');
      navigate('/admin/parents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setAvailableStudents(data);
    } catch (error) {
      console.error('Failed to load students', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/parents/${id}`, {
        name: form.name,
        email: form.email,
        children: selectedChildren,
      });
      toast.success('Parent updated');
      setEditMode(false);
      fetchParent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChild = (studentId) => {
    if (!selectedChildren.includes(studentId)) {
      setSelectedChildren([...selectedChildren, studentId]);
    }
    setShowAddChild(false);
  };

  const handleRemoveChild = (studentId) => {
    if (window.confirm('Remove this child from the parent?')) {
      setSelectedChildren(selectedChildren.filter(id => id !== studentId));
    }
  };

  const studentOptions = availableStudents
    .filter(s => !selectedChildren.includes(s._id))
    .map(s => ({ value: s._id, label: `${s.userId?.name} (Roll: ${s.rollNumber || 'N/A'})` }));

  if (loading) return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading…</div></Layout>;
  if (!parent) return <Layout role="admin"><div className="p-6 text-center text-red-500">Parent not found.</div></Layout>;

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900">
            <FiArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xl font-semibold overflow-hidden">
              {parent.userId?.avatar ? (
                <img src={parent.userId.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                parent.userId?.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{parent.userId?.name}</h1>
              <p className="text-sm text-slate-500">Parent / Guardian</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white text-sm">
              <FiEdit2 className="mr-2" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 card">
          {editMode ? (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field bg-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white text-sm">
                  <FiSave className="inline mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><dt className="text-sm text-slate-500">Full Name</dt><dd className="font-medium text-slate-900">{parent.userId?.name}</dd></div>
                <div><dt className="text-sm text-slate-500">Email</dt><dd className="text-slate-700">{parent.userId?.email}</dd></div>
                <div><dt className="text-sm text-slate-500">Username</dt><dd className="text-slate-700">{parent.userId?.username}</dd></div>
                <div><dt className="text-sm text-slate-500">Phone</dt><dd className="text-slate-700">{parent.userId?.phone || '—'}</dd></div>
              </dl>
            </div>
          )}

          {/* Linked Children Section */}
          <div className="mt-6 border-t border-pink-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                <FiUsers className="inline mr-2 text-pink-500" /> Linked Children ({selectedChildren.length})
              </h3>
              <button
                onClick={() => setShowAddChild(!showAddChild)}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <FiPlus /> Add Child
              </button>
            </div>

            {showAddChild && (
              <div className="mb-4">
                <Select
                  options={studentOptions}
                  onChange={(opt) => handleAddChild(opt?.value)}
                  placeholder="Search for a student..."
                  className="basic-select"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
            )}

            {selectedChildren.length === 0 ? (
              <p className="text-slate-500">No children linked.</p>
            ) : (
              <div className="space-y-2">
                {selectedChildren.map(childId => {
                  const child = availableStudents.find(s => s._id === childId);
                  return (
                    <div key={childId} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                      <Link to={`/admin/students/${childId}`} className="font-medium text-pink-600 hover:underline">
                        {child?.userId?.name || 'Unknown Student'} {' '}
                        <span className="text-sm text-slate-500">(Roll: {child?.rollNumber || 'N/A'})</span>
                      </Link>
                      <button onClick={() => handleRemoveChild(childId)} className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card h-fit">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Total Children</p>
              <p className="text-xl font-bold text-slate-900">{selectedChildren.length}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ParentDetail;