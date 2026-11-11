import { useEffect, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { getMedicalProfiles, saveMedicalProfile } from '../../services/medicalClinicService';

const emptyForm = {
  studentId: '',
  bloodGroup: '',
  allergies: '',
  conditions: '',
  currentMedications: '',
  emergencyNotes: '',
  primaryDoctor: '',
  notes: '',
};

const MedicalProfilesPage = () => {
  const [students, setStudents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [studentsRes, profilesRes] = await Promise.all([api.get('/students'), getMedicalProfiles()]);
    setStudents(studentsRes.data?.students || studentsRes.data || []);
    setProfiles(profilesRes.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await saveMedicalProfile({
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map((item) => item.trim()).filter(Boolean) : [],
        conditions: form.conditions ? form.conditions.split(',').map((item) => item.trim()).filter(Boolean) : [],
        currentMedications: form.currentMedications ? form.currentMedications.split(',').map((item) => item.trim()).filter(Boolean) : [],
      });
      toast.success('Medical profile saved');
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save medical profile');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={HeartPulse} title="Student Medical Profiles" subtitle="Store allergies, conditions, medications, and emergency notes" tone="blue" />
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              <option value="">Select student</option>
              {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}
            </select>
            <input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} placeholder="Blood group" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.primaryDoctor} onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })} placeholder="Primary doctor" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Allergies, comma separated" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="Conditions, comma separated" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} placeholder="Current medications" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.emergencyNotes} onChange={(e) => setForm({ ...form, emergencyNotes: e.target.value })} placeholder="Emergency notes" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
            <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Save Profile</button>
          </form>
        </DashboardCard>
        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Student', 'Blood', 'Allergies', 'Conditions', 'Medications'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile) => (
                  <tr key={profile._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{profile.studentId?.userId?.name || 'Student'}</td>
                    <td className="px-4 py-3">{profile.bloodGroup || '—'}</td>
                    <td className="px-4 py-3">{(profile.allergies || []).join(', ') || '—'}</td>
                    <td className="px-4 py-3">{(profile.conditions || []).join(', ') || '—'}</td>
                    <td className="px-4 py-3">{(profile.currentMedications || []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default MedicalProfilesPage;
