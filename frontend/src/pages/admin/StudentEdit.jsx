import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiTrash2, FiPlus } from 'react-icons/fi';
import Select from 'react-select';

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    admissionNumber: '',
    admissionDate: '',
    dateOfBirth: '',
    cnic: '',
    formBNumber: '',
    gender: 'male',
    bloodGroup: '',
    address: '',
    medicalNotes: '',
    previousSchool: '',
    classId: '',
    rollNumber: '',
    documents: [],
    guardians: [{ name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '', isPrimary: false }]
  });

  useEffect(() => {
    const fetchClass = async () => {
      const { data } = await api.get('/classes');
      setClasses(data);
    };
    const fetchStudent = async () => {
      const { data } = await api.get(`/students/${id}`);
      setForm({
        admissionNumber: data.admissionNumber || '',
        admissionDate: data.admissionDate ? data.admissionDate.slice(0, 10) : '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
        cnic: data.cnic || '',
        formBNumber: data.formBNumber || '',
        gender: data.gender || 'male',
        bloodGroup: data.bloodGroup || '',
        address: data.address || '',
        medicalNotes: data.medicalNotes || '',
        previousSchool: data.previousSchool || '',
        classId: data.classId?._id || '',
        rollNumber: data.rollNumber || '',
        documents: data.documents || [],
        guardians: data.guardians?.length ? data.guardians : [{ name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '', isPrimary: false }],
      });
    };
    fetchClass();
    if (id) fetchStudent();
  }, [id]);

  const handleGuardianChange = (index, field, value) => {
    const updated = [...form.guardians];
    updated[index][field] = value;
    setForm({ ...form, guardians: updated });
  };

  const addGuardian = () => {
    setForm({ ...form, guardians: [...form.guardians, { name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '', isPrimary: false }] });
  };

  const removeGuardian = (index) => {
    const updated = form.guardians.filter((_, i) => i !== index);
    setForm({ ...form, guardians: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/students/${id}`, form);
      toast.success('Student updated');
      navigate(`/admin/students/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Student Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Admission Number" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
            <Input label="Admission Date" type="date" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
            <Input label="CNIC" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} placeholder="XXXXX-XXXXXXX-X" />
            <Input label="Form-B / B-Form Number" value={form.formBNumber} onChange={e => setForm({...form, formBNumber: e.target.value})} />
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Blood Group" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} />
            <Input label="Roll Number" value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} />
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <Select
                options={classOptions}
                value={classOptions.find(c => c.value === form.classId) || null}
                onChange={opt => setForm({...form, classId: opt?.value || ''})}
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <Input label="Medical Notes" type="textarea" value={form.medicalNotes} onChange={e => setForm({...form, medicalNotes: e.target.value})} />
          <Input label="Previous School" value={form.previousSchool} onChange={e => setForm({...form, previousSchool: e.target.value})} />

          {/* Guardians */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Guardians</h2>
              <button type="button" onClick={addGuardian} className="text-blue-600 flex items-center gap-1"><FiPlus /> Add Guardian</button>
            </div>
            {form.guardians.map((g, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <Input label="Name" value={g.name} onChange={e => handleGuardianChange(idx, 'name', e.target.value)} />
                <Input label="Relation" value={g.relation} onChange={e => handleGuardianChange(idx, 'relation', e.target.value)} />
                <Input label="Phone" value={g.phone} onChange={e => handleGuardianChange(idx, 'phone', e.target.value)} />
                <Input label="Email" value={g.email} onChange={e => handleGuardianChange(idx, 'email', e.target.value)} />
                <Input label="Occupation" value={g.occupation} onChange={e => handleGuardianChange(idx, 'occupation', e.target.value)} />
                <Input label="Address" value={g.address} onChange={e => handleGuardianChange(idx, 'address', e.target.value)} />
                <div className="flex items-end">
                  <button type="button" onClick={() => removeGuardian(idx)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-2">
              <FiSave /> {loading ? 'Savingâ€¦' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

// Reusable input component (handles text and textarea)
const Input = ({ label, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    {type === 'textarea' ? (
      <textarea value={value} onChange={onChange} className="input-field" rows="2" />
    ) : (
      <input type={type} value={value} onChange={onChange} className="input-field" />
    )}
  </div>
);

export default StudentEdit;
