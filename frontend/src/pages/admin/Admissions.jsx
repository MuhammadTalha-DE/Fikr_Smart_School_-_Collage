import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import {
  FiEye, FiCheck, FiX, FiUserPlus, FiRefreshCw, FiFilter,
  FiEdit2, FiTrash2, FiSave, FiX as FiXIcon
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Select from 'react-select';

const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useDropdownData('/classes');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [editForm, setEditForm] = useState({
    studentName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    address: '',
    previousSchool: '',
    intendedClass: '',
    guardians: [{ name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '' }],
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAdmissions(); }, [statusFilter, classFilter]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.class = classFilter;
      const { data } = await api.get('/admissions', { params });
      setAdmissions(data.admissions);
    } catch { toast.error('Failed to load admissions'); }
    finally { setLoading(false); }
  };

  const handleAccept = async (id) => {
    if (!window.confirm('Accept this application and create student?')) return;
    try {
      const { data } = await api.put(`/admissions/${id}/accept`);
      toast.success(`Student enrolled! Temp password: ${data.temporaryPassword}`);
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed');
    }
  };

  const handleReject = async (id) => {
    const remarks = prompt('Reason for rejection (optional):');
    try {
      await api.put(`/admissions/${id}/reject`, { remarks });
      toast.success('Application rejected');
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application permanently?')) return;
    try {
      await api.delete(`/admissions/${id}`);
      toast.success('Application deleted');
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ── Edit modal handlers ──
  const openEditModal = (adm) => {
    setEditingAdmission(adm);
    setEditForm({
      studentName: adm.studentName || '',
      email: adm.email || '',
      phone: adm.phone || '',
      dateOfBirth: adm.dateOfBirth ? adm.dateOfBirth.slice(0, 10) : '',
      gender: adm.gender || 'male',
      bloodGroup: adm.bloodGroup || '',
      address: adm.address || '',
      previousSchool: adm.previousSchool || '',
      intendedClass: adm.intendedClass?._id || '',
      guardians: adm.guardians?.length ? adm.guardians.map(g => ({...g})) : [{ name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '' }],
      remarks: adm.remarks || '',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingAdmission(null);
  };

  const handleGuardianChange = (idx, field, value) => {
    const updated = [...editForm.guardians];
    updated[idx][field] = value;
    setEditForm({ ...editForm, guardians: updated });
  };

  const addGuardian = () => {
    setEditForm({ ...editForm, guardians: [...editForm.guardians, { name: '', relation: 'Father', phone: '', email: '', occupation: '', address: '' }] });
  };

  const removeGuardian = (idx) => {
    setEditForm({ ...editForm, guardians: editForm.guardians.filter((_, i) => i !== idx) });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.studentName || !editForm.intendedClass) return toast.error('Name and class are required');
    setSaving(true);
    try {
      await api.put(`/admissions/${editingAdmission._id}`, editForm);
      toast.success('Application updated');
      closeEditModal();
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  // ── Styling helper ──
  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return `px-3 py-1 text-xs font-medium rounded-full border ${colors[status]}`;
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Admissions</h1>
            <p className="text-sm text-gray-500 mt-1">{admissions.length} application(s)</p>
          </div>
          <Link to="/admin/admissions/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition">
            <FiUserPlus /> New Application
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="input-field bg-white w-36">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="input-field bg-white w-44">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button onClick={fetchAdmissions} className="btn-secondary flex items-center gap-1">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Application Cards */}
        {loading ? <p className="text-center py-12 text-gray-500">Loading applications…</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admissions.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">No applications found.</div>
            )}
            {admissions.map(adm => (
              <div key={adm._id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{adm.studentName}</h3>
                    <p className="text-sm text-gray-500">{adm.intendedClass?.name || 'No class'}</p>
                  </div>
                  <span className={getStatusBadge(adm.applicationStatus)}>{adm.applicationStatus}</span>
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Applied: {new Date(adm.applicationDate).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t">
                  <Link to={`/admin/admissions/${adm._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <FiEye className="w-4 h-4" /> View
                  </Link>
                  <div className="flex gap-2">
                    {adm.applicationStatus === 'pending' && (
                      <>
                        <button onClick={() => openEditModal(adm)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleAccept(adm._id)} className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1">
                          <FiCheck className="w-4 h-4" /> Accept
                        </button>
                        <button onClick={() => handleReject(adm._id)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1">
                          <FiX className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {/* Delete available for all statuses */}
                    <button onClick={() => handleDelete(adm._id)} className="text-gray-400 hover:text-red-600 text-sm ml-1" title="Delete">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Edit Modal ─────────────────────────────────────── */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Application</h2>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600"><FiXIcon size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Student Name *" value={editForm.studentName} onChange={e => setEditForm({...editForm, studentName: e.target.value})} />
                  <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  <Input label="Phone" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  <Input label="Date of Birth" type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="input-field">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input label="Blood Group" value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} />
                  <div className="md:col-span-2">
                    <Input label="Address" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                  <Input label="Previous School" value={editForm.previousSchool} onChange={e => setEditForm({...editForm, previousSchool: e.target.value})} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intended Class *</label>
                    <Select
                      options={classOptions}
                      value={classOptions.find(c => c.value === editForm.intendedClass) || null}
                      onChange={opt => setEditForm({...editForm, intendedClass: opt?.value || ''})}
                      placeholder="Select class"
                      classNamePrefix="select"
                    />
                  </div>
                </div>

                {/* Guardians */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Guardians</h3>
                    <button type="button" onClick={addGuardian} className="text-blue-600 text-sm flex items-center gap-1"><FiUserPlus size={14} /> Add</button>
                  </div>
                  {editForm.guardians.map((g, idx) => (
                    <div key={idx} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
                      <Input label="Name" value={g.name} onChange={e => handleGuardianChange(idx, 'name', e.target.value)} />
                      <Input label="Relation" value={g.relation} onChange={e => handleGuardianChange(idx, 'relation', e.target.value)} />
                      <Input label="Phone" value={g.phone} onChange={e => handleGuardianChange(idx, 'phone', e.target.value)} />
                      <Input label="Email" value={g.email} onChange={e => handleGuardianChange(idx, 'email', e.target.value)} />
                      <Input label="Occupation" value={g.occupation} onChange={e => handleGuardianChange(idx, 'occupation', e.target.value)} />
                      <Input label="Address" value={g.address} onChange={e => handleGuardianChange(idx, 'address', e.target.value)} />
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeGuardian(idx)} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeEditModal} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary bg-blue-600 text-white flex items-center gap-1">
                    <FiSave size={16} /> {saving ? 'Saving...' : 'Update Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Reusable input component
const Input = ({ label, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value} onChange={onChange} className="input-field" />
  </div>
);

export default Admissions;