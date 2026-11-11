import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Select from 'react-select';

const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', inCharge: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabs();
    fetchTeachers();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data } = await api.get('/lab/labs');
      setLabs(data);
    } catch (error) {
      toast.error('Failed to load labs');
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (error) {
      toast.error('Failed to load teachers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Lab name is required');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        inCharge: form.inCharge || null,
      };
      if (editingLab) {
        await api.put(`/lab/labs/${editingLab._id}`, payload);
        toast.success('Lab updated');
      } else {
        await api.post('/lab/labs', payload);
        toast.success('Lab created');
      }
      setShowModal(false);
      setForm({ name: '', description: '', location: '', inCharge: '' });
      setEditingLab(null);
      fetchLabs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteLab = async (id) => {
    if (!window.confirm('Delete this lab?')) return;
    try {
      await api.delete(`/lab/labs/${id}`);
      toast.success('Lab deleted');
      fetchLabs();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const openEditModal = (lab) => {
    setEditingLab(lab);
    setForm({
      name: lab.name,
      description: lab.description || '',
      location: lab.location || '',
      inCharge: lab.inCharge?._id || '',
    });
    setShowModal(true);
  };

  const teacherOptions = teachers.map(t => ({
    value: t._id,
    label: t.userId?.name || 'Unnamed',
  }));

  return (
    <Layout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lab Management</h1>
        <button
          onClick={() => {
            setEditingLab(null);
            setForm({ name: '', description: '', location: '', inCharge: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Add Lab
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map(lab => (
          <div key={lab._id} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{lab.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => openEditModal(lab)} className="text-blue-600 hover:text-blue-800">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteLab(lab._id)} className="text-red-600 hover:text-red-800">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {lab.description && <p className="text-sm text-gray-600 mt-1">{lab.description}</p>}
            {lab.location && <p className="text-sm text-gray-500">Location: {lab.location}</p>}
            <p className="text-sm text-gray-500">
              In‑Charge: {lab.inCharge?.userId?.name || 'Not assigned'}
            </p>
          </div>
        ))}
      </div>

      {/* Lab Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingLab ? 'Edit Lab' : 'Create New Lab'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Lab Name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input-field"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">In‑Charge (Teacher)</label>
                <Select
                  options={teacherOptions}
                  value={teacherOptions.find(opt => opt.value === form.inCharge) || null}
                  onChange={(selected) => setForm({ ...form, inCharge: selected?.value || '' })}
                  isClearable
                  placeholder="Select teacher..."
                  className="basic-select"
                  classNamePrefix="select"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Labs;