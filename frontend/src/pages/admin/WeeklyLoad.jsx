import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';   // 🔥 NEW
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiBook } from 'react-icons/fi';
import Select from 'react-select';

const WeeklyLoad = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔥 Fetch real subjects from Subject module
  const { data: realSubjects } = useDropdownData('/subjects', 'subjects');

  // Build subject options (value = subject name, label = "CODE - Name")
  const subjectOptions = realSubjects.map(s => ({
    value: s.name,
    label: `${s.code} - ${s.name}`,
  }));

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchLoad();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const fetchLoad = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/setup/weekly-load/${selectedClass}`);
      setLoads(data?.loads || [{ subject: '', periods: 1 }]);
    } catch (error) {
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
    const updated = loads.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setLoads(updated);
  };

  const handleSave = async () => {
    // Filter empty subjects
    const validLoads = loads.filter(l => l.subject.trim() !== '');
    if (validLoads.length === 0) {
      toast.error('At least one subject with periods required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/setup/weekly-load', { classId: selectedClass, loads: validLoads });
      toast.success('Weekly load saved');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      <div className="relative overflow-hidden">
        {/* Decorative floating orbs */}
        <div className="absolute top-0 left-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              <FiBook className="inline mr-2 text-indigo-600" /> Weekly Subject Load
            </h1>
            <button
              onClick={handleAddRow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <FiPlus /> Add Subject
            </button>
          </div>

          {/* Glass card */}
          <div className="bg-white backdrop-blur-md bg-opacity-70 rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
            <div className="w-72 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
              <Select
                options={classOptions}
                value={classOptions.find(c => c.value === selectedClass) || null}
                onChange={opt => setSelectedClass(opt?.value || '')}
                placeholder="Pick a class..."
                className="basic-select"
                classNamePrefix="select"
              />
            </div>

            {selectedClass && (
              <>
                {loading ? (
                  <p className="text-gray-500">Loading load data...</p>
                ) : (
                  <div className="space-y-4 mt-4">
                    {loads.map((item, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        {/* 🔥 Replace text input with Subject Select */}
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
                            min="1"
                            max="8"
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
                  >
                    <FiSave /> {saving ? 'Saving...' : 'Save Load'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeeklyLoad;