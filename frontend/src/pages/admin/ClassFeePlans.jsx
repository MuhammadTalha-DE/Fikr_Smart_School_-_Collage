import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiBook, FiDollarSign } from 'react-icons/fi';
import Select from 'react-select';

const ClassFeePlans = () => {  
  const [plans, setPlans] = useState([]);
  const [generating, setGenerating] = useState(null);  // planId being processed
  const [classes, setClasses] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    classId: '',
    feeItems: [],
    frequency: 'Monthly',
    instalmentCount: 12,
    dueDay: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchClasses();
    fetchFeeHeads();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/fee-setup/class-fee-plans');
      setPlans(data);
    } catch (error) { toast.error('Failed to load fee plans'); }
  };

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const fetchFeeHeads = async () => {
    const { data } = await api.get('/fee-setup/fee-heads');
    setFeeHeads(data);
  };

  const handleAddFeeItem = () => {
    setForm({...form, feeItems: [...form.feeItems, { feeHeadId: '', amount: 0 }]});
  };

  const handleRemoveFeeItem = (index) => {
    setForm({...form, feeItems: form.feeItems.filter((_, i) => i !== index)});
  };

  const handleFeeItemChange = (index, field, value) => {
    const updated = [...form.feeItems];
    updated[index][field] = value;
    setForm({...form, feeItems: updated});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classId || form.feeItems.length === 0 || form.feeItems.some(item => !item.feeHeadId || item.amount <= 0)) {
      return toast.error('Complete all fields');
    }
    setLoading(true);
    try {
      if (editingPlan) {
        await api.put(`/fee-setup/class-fee-plans/${editingPlan._id}`, form);
        toast.success('Fee plan updated');
      } else {
        await api.post('/fee-setup/class-fee-plans', form);
        toast.success('Fee plan created');
      }
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this fee plan?')) return;
    try {
      await api.delete(`/fee-setup/class-fee-plans/${id}`);
      toast.success('Deleted');
      fetchPlans();
    } catch (error) { toast.error('Delete failed'); }
  };

  const handlePublish = async (planId) => {
  if (!window.confirm('Generate fee accounts for all students in this class? This will replace any existing accounts for this plan.')) return;
  setGenerating(planId);
  try {
    const { data } = await api.post(`/fee-accounts/generate/${planId}`);
    toast.success(`Accounts created for ${data.accountsCreated} students`);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Generation failed');
  } finally {
    setGenerating(null);
  }
};

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const feeHeadOptions = feeHeads.map(f => ({ value: f._id, label: f.name }));

  return (
    <Layout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FiBook className="text-primary-600" /> Class Fee Plans
        </h1>
        <button onClick={() => { setEditingPlan(null); setForm({ classId: '', feeItems: [], frequency: 'Monthly', instalmentCount: 12, dueDay: 10 }); setShowModal(true); }} className="btn-primary flex items-center gap-1">
          <FiPlus /> Add Fee Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{plan.classId?.name}</h3>
              <div className="flex gap-2">
                 <button
    onClick={() => handlePublish(plan._id)}
    disabled={generating === plan._id}
    className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
  >
    {generating === plan._id ? 'Publishing…' : 'Publish'}
  </button>
                <button onClick={() => { setEditingPlan(plan); setForm({ classId: plan.classId._id, feeItems: plan.feeItems.map(item => ({ feeHeadId: item.feeHeadId._id, amount: item.amount })), frequency: plan.frequency, instalmentCount: plan.instalmentCount, dueDay: plan.dueDay }); setShowModal(true); }} className="text-blue-600"><FiEdit2 /></button>
                <button onClick={() => deletePlan(plan._id)} className="text-red-600"><FiTrash2 /></button>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {plan.feeItems.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.feeHeadId?.name}</span>
                  <span className="font-medium">PKR {item.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {plan.frequency} • {plan.instalmentCount} instalments • Due by {plan.dueDay}th
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingPlan ? 'Edit Fee Plan' : 'Create Fee Plan'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                options={classOptions}
                value={classOptions.find(c => c.value === form.classId) || null}
                onChange={opt => setForm({...form, classId: opt?.value || ''})}
                placeholder="Select Class *"
                className="basic-select" classNamePrefix="select"
                isDisabled={!!editingPlan}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Fee Items *</label>
                {form.feeItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <Select
                      options={feeHeadOptions}
                      value={feeHeadOptions.find(f => f.value === item.feeHeadId) || null}
                      onChange={opt => handleFeeItemChange(idx, 'feeHeadId', opt?.value || '')}
                      placeholder="Fee head"
                      className="basic-select flex-1" classNamePrefix="select"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={e => handleFeeItemChange(idx, 'amount', Number(e.target.value))}
                      className="input-field w-32"
                    />
                    <button type="button" onClick={() => handleRemoveFeeItem(idx)} className="text-red-500"><FiTrash2 /></button>
                  </div>
                ))}
                <button type="button" onClick={handleAddFeeItem} className="text-sm text-primary-600 hover:underline">+ Add fee head</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="input-field">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <input type="number" placeholder="Instalments" value={form.instalmentCount} onChange={e => setForm({...form, instalmentCount: Number(e.target.value)})} className="input-field" />
                <input type="number" placeholder="Due day" value={form.dueDay} onChange={e => setForm({...form, dueDay: Number(e.target.value)})} className="input-field" />
              </div>
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

export default ClassFeePlans;