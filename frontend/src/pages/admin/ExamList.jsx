import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';   // 🔥 NEW
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiCalendar, FiBook, FiClock, FiExternalLink, FiFilter
} from 'react-icons/fi';
import Select from 'react-select';          // regular Select only (no Creatable)

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form, setForm] = useState({
    name: '', classId: '', subjects: [], date: '', session: 'Morning', maxMarks: 100,
  });
  const [loading, setLoading] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  // 🔥 Fetch real subjects from Subject module
  const { data: realSubjects } = useDropdownData('/subjects', 'subjects');

  // Build subject options (value = name, label = "CODE - Name")
  const subjectOptions = realSubjects.map(s => ({
    value: s.name,
    label: `${s.code} - ${s.name}`,
  }));

  useEffect(() => { fetchExams(); fetchClasses(); }, [filterClass]);

  const fetchExams = async () => {
    try {
      const params = filterClass ? { classId: filterClass } : {};
      const { data } = await api.get('/exams', { params });
      setExams(data);
    } catch (error) { toast.error('Failed to load exams'); }
  };

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.classId || form.subjects.length === 0 || !form.date) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    // subjects are already strings (names) from the Select
    const payload = { ...form, subjects: form.subjects.map(s => s.value) };
    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam._id}`, payload);
        toast.success('Exam updated');
      } else {
        await api.post('/exams', payload);
        toast.success('Exam created');
      }
      setShowForm(false);
      setForm({ name: '', classId: '', subjects: [], date: '', session: 'Morning', maxMarks: 100 });
      setEditingExam(null);
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      fetchExams();
    } catch (error) { toast.error('Delete failed'); }
  };

  const openEdit = (exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      classId: exam.classId._id,
      // map existing subject strings to react‑select options
      subjects: exam.subjects.map(s => ({ value: s, label: s })),
      date: exam.date ? exam.date.slice(0, 10) : '',
      session: exam.session,
      maxMarks: exam.maxMarks,
    });
    setShowForm(true);
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Exams
        </h1>
        <button
          onClick={() => { setEditingExam(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <FiPlus /> New Exam
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <FiFilter className="inline mr-1" /> Filter by class:
        </label>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="input-field w-48 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div
            key={exam._id}
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Gradient Top Border */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />

            <div className="p-5">
              {/* Title & Actions */}
              <div className="flex justify-between items-start">
                {/* Clickable Title */}
                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Link
                    to={`/admin/exams/${exam._id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {exam.name}
                  </Link>
                </h3>

                {/* Edit / Delete / Open */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/admin/exams/${exam._id}`}
                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEdit(exam)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit Exam"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteExam(exam._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Exam"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiBook className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  <span className="font-medium">Class:</span>&nbsp;
                  {exam.classId?.name}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiCalendar className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  <span className="font-medium">Date:</span>&nbsp;
                  {new Date(exam.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiClock className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  <span className="font-medium">Session:</span>&nbsp;
                  {exam.session}
                </p>
              </div>

              {/* Subjects Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {exam.subjects.map(sub => (
                  <span
                    key={sub}
                    className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-medium rounded-full"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingExam ? 'Edit Exam' : 'Create New Exam'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Exam Name *"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="input-field bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
              <Select
                options={classOptions}
                value={classOptions.find(o => o.value === form.classId) || null}
                onChange={opt => setForm({...form, classId: opt?.value || ''})}
                placeholder="Select Class *"
                className="basic-select"
                classNamePrefix="select"
              />
              {/* 🔥 Subjects – now from Subject module, no fly creation */}
              <Select
                isMulti
                options={subjectOptions}
                value={form.subjects}
                onChange={newVal => setForm({...form, subjects: newVal})}
                placeholder="Select subjects..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="input-field bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  required
                />
                <select
                  value={form.session}
                  onChange={e => setForm({...form, session: e.target.value})}
                  className="input-field bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Max Marks"
                value={form.maxMarks}
                onChange={e => setForm({...form, maxMarks: e.target.value})}
                className="input-field bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExamList;