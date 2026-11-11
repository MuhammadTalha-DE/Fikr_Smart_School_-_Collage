import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiDollarSign } from 'react-icons/fi';

const FeeHeads = () => {
  const [feeHeads, setFeeHeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchFeeHeads(); }, []);

  const fetchFeeHeads = async () => {
    try {
      const { data } = await api.get('/fee-setup/fee-heads');
      setFeeHeads(data);
    } catch (error) { toast.error('Failed to load fee heads'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setLoading(true);
    try {
      if (editingHead) {
        await api.put(`/fee-setup/fee-heads/${editingHead._id}`, form);
        toast.success('Fee head updated');
      } else {
        await api.post('/fee-setup/fee-heads', form);
        toast.success('Fee head created');
      }
      setShowModal(false);
      setForm({ name: '', description: '' });
      setEditingHead(null);
      fetchFeeHeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  const deleteFeeHead = async (id) => {
    if (!window.confirm('Delete this fee head?')) return;
    try {
      await api.delete(`/fee-setup/fee-heads/${id}`);
      toast.success('Deleted');
      fetchFeeHeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FiDollarSign className="text-primary-600" /> Fee Heads
        </h1>
        <button onClick={() => { setEditingHead(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1">
          <FiPlus /> Add Fee Head
        </button>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {feeHeads.map(head => (
              <tr key={head._id}>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{head.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{head.description || '—'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditingHead(head); setForm({ name: head.name, description: head.description }); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><FiEdit2 /></button>
                  <button onClick={() => deleteFeeHead(head._id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingHead ? 'Edit Fee Head' : 'New Fee Head'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FeeHeads;