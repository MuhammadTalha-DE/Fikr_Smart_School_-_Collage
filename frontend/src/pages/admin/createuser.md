import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FiUserPlus, FiBriefcase, FiBookOpen } from 'react-icons/fi';

const CreateUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'student',
    classId: '',
    parentId: '',
    subjects: [],
    preferredSubjects: [],
    preferredGrades: [],
  });

  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchParents();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch { toast.error('Failed to load classes'); }
  };

  const fetchParents = async () => {
    try {
      const { data } = await api.get('/parents');
      setParents(data);
    } catch { toast.error('Failed to load parents'); }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects || []);
    } catch { toast.error('Failed to load subjects'); }
  };

  const subjectOptions = subjects.map(s => ({
    value: s._id,
    label: `${s.code} - ${s.name}`,
  }));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === 'student') {
        payload.classId = form.classId || null;
        payload.parentId = form.parentId || null;
      }

      if (form.role === 'teacher') {
        payload.subjects = form.subjects;
        payload.preferredSubjects = form.preferredSubjects;
        payload.preferredGrades = form.preferredGrades;
      }

      await api.post('/users', payload);
      toast.success('User created');
      setTimeout(() => navigate('/admin/users'), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // react-select styles (light version)
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#fff',
      borderColor: '#d1d5db',
      borderRadius: '0.5rem',
      boxShadow: 'none',
      '&:hover': { borderColor: '#6366f1' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#fff',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#eef2ff' : 'transparent',
      color: '#1f2937',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e0e7ff',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#4338ca',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#4338ca',
      ':hover': { backgroundColor: '#c7d2fe', color: '#1e1b4b' },
    }),
  };

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
              <FiUserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-500 mt-2">Add a new member to the school system</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <FiUserPlus className="text-indigo-600" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Enter full name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input type="text" name="username" value={form.username} onChange={handleChange} required placeholder="Choose a username"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Min. 6 characters"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Role & Assignment */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <FiBriefcase className="text-indigo-600" />
                  Role & Assignment
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select name="role" value={form.role} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="student">🧑‍🎓 Student</option>
                      <option value="teacher">🧑‍🏫 Teacher</option>
                      <option value="parent">👨‍👩‍👧 Parent</option>
                      <option value="librarian">📚 Librarian</option>
                      <option value="warden">🏢 Warden</option>   {/* 👈 NEW */}
                    </select>
                  </div>

                  {form.role === 'student' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                        <select name="classId" value={form.classId} onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500">
                          <option value="">Select Class</option>
                          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Parent</label>
                        <select name="parentId" value={form.parentId || ''} onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500">
                          <option value="">Select Parent</option>
                          {parents.map(p => <option key={p._id} value={p._id}>{p.userId?.name || 'Unnamed Parent'}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Subjects (only if role = teacher) */}
              {form.role === 'teacher' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <FiBookOpen className="text-indigo-600" />
                    Subjects & Preferences
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                      <Select
                        isMulti
                        options={subjectOptions}
                        placeholder="Select subjects..."
                        value={subjectOptions.filter(o => form.subjects.includes(o.value))}
                        onChange={(opts) => setForm({ ...form, subjects: opts.map(o => o.value) })}
                        styles={selectStyles}
                        classNamePrefix="select"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Subjects</label>
                      <Select
                        isMulti
                        options={subjectOptions}
                        placeholder="Select preferred..."
                        value={subjectOptions.filter(o => form.preferredSubjects.includes(o.value))}
                        onChange={(opts) => setForm({ ...form, preferredSubjects: opts.map(o => o.value) })}
                        styles={selectStyles}
                        classNamePrefix="select"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Grades</label>
                      <CreatableSelect
                        isMulti
                        placeholder="Select or type grades..."
                        value={form.preferredGrades.map(g => ({ value: g, label: g }))}
                        onChange={(opts) => setForm({ ...form, preferredGrades: opts.map(o => o.value) })}
                        styles={selectStyles}
                        classNamePrefix="select"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => navigate('/admin/users')}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateUser;