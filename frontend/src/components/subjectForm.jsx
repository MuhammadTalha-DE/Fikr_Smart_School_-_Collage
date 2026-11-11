import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SubjectForm = ({ subject, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '', code: '', credits: 0, type: 'Theory', category: 'Core',
    department: '', description: '', isActive: true, prerequisites: [],
  });
  const [loading, setLoading] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);

  // Prefill when editing
  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name,
        code: subject.code,
        credits: subject.credits || 0,
        type: subject.type || 'Theory',
        category: subject.category || 'Core',
        department: subject.department || '',
        description: subject.description || '',
        isActive: subject.isActive ?? true,
        prerequisites: subject.prerequisites?.map(p => p._id) || [],
      });
    }
  }, [subject]);

  useEffect(() => {
    // Fetch subjects for prerequisite selection
    api.get('/subjects').then(res => setSubjectsList(res.data.subjects || [])).catch(() => {});
  }, []);

  const handlePrerequisiteToggle = (subId) => {
    setForm(prev => {
      const exists = prev.prerequisites.includes(subId);
      return {
        ...prev,
        prerequisites: exists
          ? prev.prerequisites.filter(id => id !== subId)
          : [...prev.prerequisites, subId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return toast.error('Name and code are required');
    if (!Number.isFinite(Number(form.credits)) || Number(form.credits) < 0) {
      return toast.error('Credits must be a number that is zero or greater.');
    }
    setLoading(true);
    try {
      const payload = { ...form, credits: Number(form.credits) };
      if (subject) {
        await api.put(`/subjects/${subject._id}`, payload);
        toast.success('Subject updated');
      } else {
        await api.post('/subjects', payload);
        toast.success('Subject created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">{subject ? 'Edit' : 'Create'} Subject</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credits</label>
              <input type="number" min="0" step="any" value={form.credits} onChange={e => setForm({...form, credits: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded">
                <option>Theory</option>
                <option>Practical</option>
                <option>Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2 border rounded">
                <option>Core</option>
                <option>Elective</option>
                <option>Optional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g., Computer Science" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded" rows={2} />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
            <label className="text-sm">Active</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prerequisites</label>
            <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
              {subjectsList.filter(s => s._id !== subject?._id).map(s => (
                <label key={s._id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.prerequisites.includes(s._id)}
                    onChange={() => handlePrerequisiteToggle(s._id)}
                  />
                  <span>{s.code} - {s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;
