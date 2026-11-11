import { useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiTrash2, FiSave, FiUserPlus, FiArrowLeft,
  FiUsers, FiBook, FiMapPin, FiHeart, FiFlag
} from 'react-icons/fi';
import Select from 'react-select';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const { data: classes } = useDropdownData('/classes');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentName: '',
    email: '',
    phone: '',
    cnic: '',
    formBNumber: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    religion: '',
    country: '',
    province: '',
    address: '',
    previousSchool: '',
    intendedClass: '',
    section: '',
    overallBehaviour: 'Good',
    guardians: [
      { name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '' }
    ],
    documents: [],
  });

  const handleGuardianChange = (idx, field, value) => {
    const updated = [...form.guardians];
    updated[idx][field] = value;
    setForm({ ...form, guardians: updated });
  };

  const addGuardian = () => {
    setForm({
      ...form,
      guardians: [
        ...form.guardians,
        { name: '', relation: '', phone: '', email: '', occupation: '', address: '' }
      ]
    });
  };

  const removeGuardian = (idx) => {
    // prevent removing the first (father) guardian if only one left
    if (form.guardians.length === 1) {
      toast.error('At least one guardian (Father) is required');
      return;
    }
    setForm({ ...form, guardians: form.guardians.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.studentName || !form.intendedClass) {
      return toast.error('Student name and intended class are required');
    }

    // Father mandatory
    const father = form.guardians.find(
      g => g.relation?.toLowerCase() === 'father' && g.name.trim().length > 0
    );
    if (!father) {
      return toast.error('A guardian with relation "Father" and a valid name is mandatory');
    }

    // Remove completely empty guardian rows (all fields blank) before sending
    const cleanedGuardians = form.guardians.filter(g =>
      Object.values(g).some(val => val.toString().trim() !== '')
    );
    const payload = { ...form, guardians: cleanedGuardians };

    setSaving(true);
    try {
      await api.post('/admissions', payload);
      toast.success('Application submitted successfully!');
      navigate('/admin/admissions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/admissions')}
            className="p-2 rounded-xl bg-white hover:bg-gray-100 shadow-sm transition"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUserPlus className="text-blue-600" />
              New Admission Application
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill in student details, parent/guardian information, and submit for review.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* â”€â”€â”€ Student Information â”€â”€â”€ */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Full Name *" value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} placeholder="e.g., Muhammad Ali" />
                <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@example.com" />
                <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="03XX-XXXXXXX" />
                <Input label="CNIC" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} placeholder="XXXXX-XXXXXXX-X" />
                <Input label="Form-B / B-Form Number" value={form.formBNumber} onChange={e => setForm({...form, formBNumber: e.target.value})} placeholder="Enter Form-B number" />
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input-field">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input label="Blood Group" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} placeholder="e.g., B+" />
                <Input label="Religion" value={form.religion} onChange={e => setForm({...form, religion: e.target.value})} placeholder="e.g., Islam, Christianity" />
                <Input label="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="e.g., Pakistan" />
                <Input label="Province" value={form.province} onChange={e => setForm({...form, province: e.target.value})} placeholder="e.g., Khyber Pakhtunkhwa" />
                <div className="md:col-span-2">
                  <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full residential address" />
                </div>
                <Input label="Previous School" value={form.previousSchool} onChange={e => setForm({...form, previousSchool: e.target.value})} placeholder="e.g., ABC School" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Intended Class *</label>
                  <Select
                    options={classOptions}
                    value={classOptions.find(c => c.value === form.intendedClass) || null}
                    onChange={opt => setForm({...form, intendedClass: opt?.value || ''})}
                    placeholder="Select a class..."
                    classNamePrefix="select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        borderRadius: '0.75rem',
                        padding: '0.25rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#6366f1' },
                      }),
                    }}
                  />
                </div>
                <Input label="Section" value={form.section} onChange={e => setForm({...form, section: e.target.value})} placeholder="e.g., A, B, Morning" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Overall Behaviour</label>
                  <select value={form.overallBehaviour} onChange={e => setForm({...form, overallBehaviour: e.target.value})} className="input-field">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* â”€â”€â”€ Guardians â”€â”€â”€ */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Guardians</h2>
                </div>
                <button
                  type="button"
                  onClick={addGuardian}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <FiPlus className="w-4 h-4" /> Add Guardian
                </button>
              </div>
              <p className="text-xs text-gray-500 -mt-4 mb-5">
                The first guardian must be the <strong>Father</strong>. At least his name is required.
                You can add additional guardians (mother, legal guardian, etc.).
              </p>

              {form.guardians.map((g, idx) => (
                <div
                  key={idx}
                  className="relative bg-gray-50/80 rounded-xl p-4 mb-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* "Father (required)" badge on the first guardian */}
                  {idx === 0 && (
                    <div className="absolute -top-2.5 left-4 bg-pink-100 text-pink-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <FiUsers className="w-3 h-3" /> Father (required)
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    <Input
                      label={idx === 0 ? "Father's Name *" : "Name"}
                      value={g.name}
                      onChange={e => handleGuardianChange(idx, 'name', e.target.value)}
                      required={idx === 0}
                      placeholder={idx === 0 ? "Full father's name (mandatory)" : "Full name"}
                    />
                    <Input
                      label="Relation"
                      value={g.relation}
                      onChange={e => handleGuardianChange(idx, 'relation', e.target.value)}
                      placeholder="e.g., Father, Mother, Uncle"
                    />
                    <Input
                      label="Phone"
                      value={g.phone}
                      onChange={e => handleGuardianChange(idx, 'phone', e.target.value)}
                      placeholder="03XX-XXXXXXX"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={g.email}
                      onChange={e => handleGuardianChange(idx, 'email', e.target.value)}
                      placeholder="guardian@example.com"
                    />
                    <Input
                      label="Occupation"
                      value={g.occupation}
                      onChange={e => handleGuardianChange(idx, 'occupation', e.target.value)}
                      placeholder="e.g., Engineer, Businessman"
                    />
                    <Input
                      label="Address"
                      value={g.address}
                      onChange={e => handleGuardianChange(idx, 'address', e.target.value)}
                      placeholder="Home address if different"
                    />
                  </div>

                  {/* Only show remove button if there are more than 1 guardian */}
                  {form.guardians.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuardian(idx)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove guardian"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* â”€â”€â”€ Actions â”€â”€â”€ */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/admin/admissions')}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

// Reusable input component
const Input = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
      required={required}
    />
  </div>
);

export default AdmissionForm;
