import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiTrash2, FiBell, FiCalendar, FiBook, FiUsers } from 'react-icons/fi';
import Select from 'react-select';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classOptions, setClassOptions] = useState([]);

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetRoles: [],
    targetClasses: [],
  });

  const roleOptions = [
    { value: 'all', label: 'Everyone' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'student', label: 'Students' },
    { value: 'parent', label: 'Parents' },
  ];

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
    } catch {
      toast.error('Failed to load announcements');
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClassOptions(data.map(c => ({ value: c._id, label: c.name })));
    } catch {
      toast.error('Failed to load classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message || form.targetRoles.length === 0) {
      toast.error('Fill required fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/announcements', {
        title: form.title,
        message: form.message,
        targetRoles: form.targetRoles.map(r => r.value),
        targetClasses: form.targetClasses.map(c => c.value),
      });
      toast.success('Announcement published');
      setForm({ title: '', message: '', targetRoles: [], targetClasses: [] });
      fetchAnnouncements();
    } catch {
      toast.error('Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Custom styles for react-select to match the clean, pink‑accented theme
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#f472b6' : '#e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(244,114,182,0.15)' : 'none',
      padding: '2px 4px',
      '&:hover': {
        borderColor: '#f472b6',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#fdf2f8',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#be185d',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#db2777',
      ':hover': {
        backgroundColor: '#fce7f3',
        color: '#9d174d',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#fdf2f8' : 'white',
      color: state.isFocused ? '#be185d' : '#374151',
      ':active': {
        backgroundColor: '#fce7f3',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
  };

  return (
    <Layout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FiBell className="text-pink-500" />
              Announcements
            </h1>
            <p className="text-slate-500 mt-1">Publish and manage school‑wide notices</p>
          </div>
          <div className="flex gap-4">
            <div className="card p-4 flex items-center gap-3 min-w-[160px]">
              <FiBell className="text-pink-500 text-xl" />
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{announcements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Publish Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <FiBook className="text-pink-500" />
            Publish New Announcement
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="E.g., Parent‑Teacher Meeting on Friday"
                className="input-field bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Message <span className="text-pink-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement details here..."
                className="input-field bg-white resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Audience <span className="text-pink-500">*</span>
                </label>
                <Select
                  isMulti
                  options={roleOptions}
                  value={form.targetRoles}
                  onChange={(selected) => setForm({ ...form, targetRoles: selected })}
                  placeholder="Select audience..."
                  styles={selectStyles}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Classes <span className="text-slate-400">(optional)</span>
                </label>
                <Select
                  isMulti
                  options={classOptions}
                  value={form.targetClasses}
                  onChange={(selected) => setForm({ ...form, targetClasses: selected })}
                  placeholder="All classes"
                  isClearable
                  styles={selectStyles}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-2"
              >
                <FiSend />
                {loading ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-pink-500" />
            Published Announcements
          </h2>

          {announcements.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <FiBell className="mx-auto text-4xl text-slate-300 mb-3" />
              <p className="text-lg font-medium">No announcements yet</p>
              <p className="text-sm">Use the form above to create your first announcement.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="card p-6 hover:border-pink-200 transition-colors group">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{ann.title}</h3>
                    <p className="mt-3 text-slate-600 leading-relaxed whitespace-pre-line">
                      {ann.message}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FiBell className="text-pink-400" />
                        <span className="font-medium">To:</span>{' '}
                        {ann.targetRoles?.includes('all')
                          ? 'Everyone'
                          : ann.targetRoles?.join(', ')}
                      </span>
                      {ann.targetClasses?.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <FiBook className="text-pink-400" />
                          <span className="font-medium">Classes:</span>{' '}
                          {ann.targetClasses.map(c => c.name || c).join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="text-pink-400" />
                        {new Date(ann.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAnnouncement(ann._id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete announcement"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Announcements;