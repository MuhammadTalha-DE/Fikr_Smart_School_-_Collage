import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';   // 🔥 NEW
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiTrash2 } from 'react-icons/fi';
import Select from 'react-select';   // 🔥 NEW

const DefaultLoadConfig = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔥 Fetch real subjects from Subject module
  const { data: realSubjects } = useDropdownData('/subjects', 'subjects');

  // Build subject options (value = subject name, label = "CODE - Name")
  const subjectOptions = realSubjects.map(s => ({
    value: s.name,
    label: `${s.code} - ${s.name}`,
  }));

  useEffect(() => {
    fetchDefaultLoad();
  }, []);

  const fetchDefaultLoad = async () => {
    try {
      const { data } = await api.get('/config/default-load');
      // data is an object like { "Mathematics": 6, ... }
      const loadArray = Object.entries(data || {}).map(([subject, periods]) => ({
        subject,
        periods,
      }));
      setLoads(loadArray.length > 0 ? loadArray : [{ subject: '', periods: 1 }]);
    } catch (error) {
      toast.error('Failed to load defaults');
      setLoads([{ subject: '', periods: 1 }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setLoads([...loads, { subject: '', periods: 1 }]);
  };

  const handleRemoveRow = (index) => {
    const updated = loads.filter((_, i) => i !== index);
    setLoads(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = loads.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLoads(updated);
  };

  const handleSave = async () => {
    const validLoads = loads.filter(l => l.subject.trim() !== '');
    if (validLoads.length === 0) {
      toast.error('At least one subject is required');
      return;
    }
    // Convert array back to object
    const loadObject = {};
    validLoads.forEach(l => {
      loadObject[l.subject.trim()] = parseInt(l.periods) || 1;
    });
    setSaving(true);
    try {
      await api.put('/config/default-load', loadObject);
      toast.success('Default load saved');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              <FiSettings className="inline mr-2 text-indigo-600" /> Global Default Load
            </h1>
            <button
              onClick={handleAddRow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition"
            >
              Add Subject
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-md bg-opacity-70 rounded-3xl shadow-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-4">
              These periods per week are used when no class‑specific weekly load is set.
            </p>
            {loading ? (
              <p className="text-gray-500">Loading…</p>
            ) : (
              <div className="space-y-4">
                {loads.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    {/* 🔥 Replace text input with Select dropdown */}
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        options={subjectOptions}
                        value={subjectOptions.find(opt => opt.value === item.subject) || null}
                        onChange={(opt) => handleChange(idx, 'subject', opt?.value || '')}
                        placeholder="Select subject..."
                        className="basic-select"
                        classNamePrefix="select"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Periods/week</label>
                      <input
                        type="number"
                        min="1" max="8"
                        value={item.periods}
                        onChange={(e) => handleChange(idx, 'periods', parseInt(e.target.value) || 1)}
                        className="w-20 input-field"
                      />
                    </div>
                    <button onClick={() => handleRemoveRow(idx)} className="text-red-500 hover:text-red-700">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg transition"
              >
                <FiSave /> {saving ? 'Saving…' : 'Save Global Load'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DefaultLoadConfig;