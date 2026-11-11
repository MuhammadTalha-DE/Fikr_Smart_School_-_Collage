import { useState } from 'react';
import Layout from '../../components/common/Layout';
import axios from 'axios';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:8000';

const DropoutPredictor = () => {
  const [form, setForm] = useState({
    admission_grade: 120, age_at_enrollment: 20, tuition_fees_up_to_date: 1,
    scholarship_holder: 0, debtor: 0, gender: 1,
    curricular_units_1st_sem_approved: 5, curricular_units_1st_sem_grade: 12,
    curricular_units_2nd_sem_approved: 4, curricular_units_2nd_sem_grade: 11,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/predict`, form);
      setResult(data);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'admission_grade', label: 'Admission Grade', min: 95, max: 190, step: 0.1, hint: '95-190' },
    { name: 'age_at_enrollment', label: 'Age at Enrollment', min: 17, max: 70, step: 1, hint: '17-70' },
    { name: 'curricular_units_1st_sem_approved', label: '1st Sem Courses Passed', min: 0, max: 20, step: 1, hint: '0-20' },
    { name: 'curricular_units_1st_sem_grade', label: '1st Sem Avg Grade', min: 0, max: 20, step: 0.1, hint: '0-20' },
    { name: 'curricular_units_2nd_sem_approved', label: '2nd Sem Courses Passed', min: 0, max: 20, step: 1, hint: '⭐ #1 Predictor' },
    { name: 'curricular_units_2nd_sem_grade', label: '2nd Sem Avg Grade', min: 0, max: 20, step: 0.1, hint: '0-20' },
  ];

  const toggles = [
    { name: 'tuition_fees_up_to_date', label: 'Tuition Fees Up to Date' },
    { name: 'scholarship_holder', label: 'Scholarship Holder' },
    { name: 'debtor', label: 'Has Debt' },
    { name: 'gender', label: 'Gender (Male=1, Female=0)' },
  ];

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <FiActivity className="text-indigo-400" /> Dropout Risk Predictor
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Student Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {fields.map(f => (
                    <div key={f.name}>
                      <label className="block text-xs text-gray-400 mb-1">{f.label} <span className="text-gray-600">({f.hint})</span></label>
                      <input type="number" name={f.name} value={form[f.name]} onChange={handleChange}
                        min={f.min} max={f.max} step={f.step}
                        className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {toggles.map(t => (
                    <div key={t.name} className="flex items-center gap-2">
                      <input type="checkbox" name={t.name} checked={!!form[t.name]}
                        onChange={e => setForm({...form, [t.name]: e.target.checked ? 1 : 0})}
                        className="w-4 h-4 rounded accent-indigo-500" />
                      <label className="text-sm text-gray-300">{t.label}</label>
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition">
                  <FiSend /> {loading ? 'Predicting...' : 'Predict Dropout Risk'}
                </button>
              </form>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Prediction Result</h2>
              {result ? (
                <div className="space-y-4">
                  <div className="text-center p-6 rounded-2xl" style={{ background: result.risk_color + '20' }}>
                    <p className="text-5xl font-extrabold" style={{ color: result.risk_color }}>{result.risk_score}%</p>
                    <p className="text-2xl font-bold text-white mt-2">{result.risk_level}</p>
                    <p className="text-gray-400 text-sm mt-1">Confidence: {result.confidence}%</p>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.recommendation}</p>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Why This Score?</h3>
                    {Object.entries(result.feature_contributions).map(([key, value]) => (
                      <div key={key} className="text-xs text-gray-300 bg-white/5 rounded-lg p-2">{value}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FiActivity className="text-5xl mb-3 opacity-50" />
                  <p>Enter student data and click "Predict"</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DropoutPredictor;