import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { useDropdownData } from '../../hooks/useDropdownData';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiCheckCircle, FiBookOpen, FiClock } from 'react-icons/fi';
import Select from 'react-select';

const LessonPlanner = () => {
  const { user } = useAuth();
  const teacherId = user?.teacherId; // assume teacher profile is linked

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    class: '',
    subject: '',
    weekNumber: 1,
    date: '',
    title: '',
    objectives: [''],
    materials: [''],
    activities: [''],
    evaluation: [''],
    linkedSyllabusUnits: [],
  });

  const { data: classes } = useDropdownData('/classes', 'classes');
  const { data: subjects } = useDropdownData('/subjects', 'subjects');
  const { data: syllabusUnits } = useDropdownData('/syllabus', 'units'); // adjust key if needed

  // Filter subjects to only those teacher teaches
  // (simplified; you can fetch teacher's subjects from teacher profile)
  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const subjectOptions = subjects.map(s => ({ value: s._id, label: `${s.code} - ${s.name}` }));
  const unitOptions = syllabusUnits.map(u => ({ value: u._id, label: `${u.unitNumber}. ${u.title}` }));

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/lesson-plans', { params: { teacher: teacherId } });
      setPlans(data.plans);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class || !form.subject || !form.title) return toast.error('Class, subject, and title are required');
    const payload = {
      ...form,
      teacher: teacherId,
      weekNumber: Number(form.weekNumber),
      linkedSyllabusUnits: form.linkedSyllabusUnits.map(u => u.value),
    };
    try {
      if (editingPlan) {
        await api.put(`/lesson-plans/${editingPlan._id}`, payload);
        toast.success('Lesson plan updated');
      } else {
        await api.post('/lesson-plans', payload);
        toast.success('Lesson plan created');
      }
      setShowForm(false);
      resetForm();
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const resetForm = () => {
    setForm({
      class: '', subject: '', weekNumber: 1, date: '', title: '',
      objectives: [''], materials: [''], activities: [''], evaluation: [''],
      linkedSyllabusUnits: [],
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/lesson-plans/${id}`);
      toast.success('Deleted');
      fetchPlans();
    } catch { toast.error('Delete failed'); }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/lesson-plans/${id}/complete`);
      toast.success('Lesson completed and coverage updated');
      fetchPlans();
    } catch { toast.error('Completion failed'); }
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      class: plan.class?._id,
      subject: plan.subject?._id,
      weekNumber: plan.weekNumber,
      date: plan.date ? plan.date.slice(0, 10) : '',
      title: plan.title,
      objectives: plan.objectives.length ? [...plan.objectives] : [''],
      materials: plan.materials.length ? [...plan.materials] : [''],
      activities: plan.activities.length ? [...plan.activities] : [''],
      evaluation: plan.evaluation.length ? [...plan.evaluation] : [''],
      linkedSyllabusUnits: plan.linkedSyllabusUnits.map(u => ({ value: u._id, label: u.title })),
    });
    setShowForm(true);
  };

  return (
    <Layout role="teacher">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <FiBookOpen className="inline mr-2 text-blue-600" /> My Lesson Plans
          </h1>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700">
            <FiPlus /> New Lesson Plan
          </button>
        </div>

        {loading ? <p className="text-gray-500">Loading…</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plans.map(plan => (
              <div key={plan._id} className="bg-white rounded-xl shadow border p-5 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{plan.title}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="text-blue-600 text-sm">Edit</button>
                    <button onClick={() => handleDelete(plan._id)} className="text-red-600 text-sm">Del</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{plan.class?.name} – {plan.subject?.name}</p>
                <p className="text-sm text-gray-500">Week {plan.weekNumber} {plan.date && `| ${new Date(plan.date).toLocaleDateString()}`}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {plan.linkedSyllabusUnits.map(u => (
                    <span key={u._id} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Unit {u.unitNumber}: {u.title}
                    </span>
                  ))}
                </div>
                {!plan.isCompleted ? (
                  <button onClick={() => handleComplete(plan._id)}
                    className="mt-3 text-sm text-green-600 hover:text-green-800 flex items-center gap-1">
                    <FiCheckCircle /> Mark Completed
                  </button>
                ) : (
                  <span className="mt-3 text-sm text-green-500 flex items-center gap-1"><FiCheckCircle /> Completed</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Form (simplified – expand as needed) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingPlan ? 'Edit' : 'Create'} Lesson Plan</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm">Class *</label>
                    <Select options={classOptions} value={classOptions.find(c => c.value === form.class)}
                      onChange={opt => setForm({...form, class: opt.value})} />
                  </div>
                  <div>
                    <label className="block text-sm">Subject *</label>
                    <Select options={subjectOptions} value={subjectOptions.find(s => s.value === form.subject)}
                      onChange={opt => setForm({...form, subject: opt.value})} />
                  </div>
                  <div>
                    <label className="block text-sm">Week Number *</label>
                    <input type="number" min="1" value={form.weekNumber}
                      onChange={e => setForm({...form, weekNumber: e.target.valueAsNumber})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm">Date (optional)</label>
                    <input type="date" value={form.date}
                      onChange={e => setForm({...form, date: e.target.value})} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm">Title *</label>
                    <input type="text" value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})} className="input-field" />
                  </div>
                </div>
                {/* Dynamic arrays for objectives, materials, etc. can be added similarly */}
                <div>
                  <label className="block text-sm">Linked Syllabus Units</label>
                  <Select isMulti options={unitOptions}
                    value={form.linkedSyllabusUnits}
                    onChange={val => setForm({...form, linkedSyllabusUnits: val})} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 text-white">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LessonPlanner;