import { useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Select from 'react-select';

const CreateProject = () => {
  const navigate = useNavigate();
  const { data: classes } = useDropdownData('/classes/my-classes');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    subject: '',
    dueDate: '',
    maxMarks: 100,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId) return toast.error('Title and class are required');
    setSaving(true);
    try {
      await api.post('/lab/projects', form);
      toast.success('Project created');
      navigate('/teacher/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="teacher">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <Input label="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Class *</label>
            <Select options={classOptions} value={classOptions.find(c => c.value === form.classId) || null}
              onChange={opt => setForm({...form, classId: opt?.value || ''})} placeholder="Select class"
            />
          </div>
          <Input label="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            <Input label="Max Marks" type="number" value={form.maxMarks} onChange={e => setForm({...form, maxMarks: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary bg-blue-600 text-white flex items-center gap-1">
              <FiSave /> {saving ? 'Saving…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

const Input = ({ label, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value} onChange={onChange} className="input-field" />
  </div>
);

export default CreateProject;