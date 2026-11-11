import { useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import { FiZap, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Select from 'react-select';

const PromotionDashboard = () => {
  const { data: classes } = useDropdownData('/classes');
  const [selectedClass, setSelectedClass] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [minAttendance, setMinAttendance] = useState(75);
  const [minMarks, setMinMarks] = useState(40);
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState(null);

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  const handleRunPromotion = async () => {
    if (!selectedClass || !academicYear) return toast.error('Select class and academic year');
    setPromoting(true);
    try {
      const { data } = await api.post('/academic-records/promote', {
        classId: selectedClass,
        academicYear,
        options: { minAttendance: parseInt(minAttendance), minMarks: parseInt(minMarks) }
      });
      setResult(data);
      toast.success('Promotion completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    } finally { setPromoting(false); }
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <FiZap className="inline mr-2 text-amber-500" /> Promotion Dashboard
        </h1>
        <p className="text-gray-500 mb-6">Evaluate and promote students for a specific academic year.</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                placeholder="e.g., 2025-2026" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <Select
                options={classOptions}
                value={classOptions.find(c => c.value === selectedClass) || null}
                onChange={opt => setSelectedClass(opt?.value || '')}
                placeholder="Select class"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Attendance %</label>
              <input type="number" value={minAttendance} onChange={e => setMinAttendance(e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Marks %</label>
              <input type="number" value={minMarks} onChange={e => setMinMarks(e.target.value)}
                className="input-field" />
            </div>
          </div>
          <button onClick={handleRunPromotion} disabled={promoting}
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2">
            <FiZap /> {promoting ? 'Processing...' : 'Run Promotion'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Result</h2>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-green-700">
                <FiCheckCircle /> Promoted: {result.promoted}
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <FiAlertCircle /> Detained: {result.detained}
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-4 text-sm text-red-600">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e.student} – {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromotionDashboard;