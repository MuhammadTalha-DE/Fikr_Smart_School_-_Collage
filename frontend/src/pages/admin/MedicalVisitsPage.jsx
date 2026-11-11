import { useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { createClinicVisit, getClinicVisits } from '../../services/medicalClinicService';

const emptyForm = {
  studentId: '',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  disposition: 'returned_to_class',
  parentAlerted: false,
};

const MedicalVisitsPage = () => {
  const [students, setStudents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [studentsRes, visitsRes] = await Promise.all([api.get('/students'), getClinicVisits()]);
    setStudents(studentsRes.data?.students || studentsRes.data || []);
    setVisits(visitsRes.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createClinicVisit(form);
      toast.success('Clinic visit recorded');
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save clinic visit');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Stethoscope} title="Clinic Visits" subtitle="Record symptoms, diagnosis, treatment, and parent alerts" tone="emerald" />
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              <option value="">Select student</option>
              {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}
            </select>
            <input value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="Symptoms" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnosis" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            <input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} placeholder="Treatment" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
            <select value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {['returned_to_class', 'sent_home', 'referred_hospital', 'hostel_rest'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.parentAlerted} onChange={(e) => setForm({ ...form, parentAlerted: e.target.checked })} />
              Parent alerted
            </label>
            <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">Record Visit</button>
          </form>
        </DashboardCard>
        <DashboardCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Student', 'Symptoms', 'Diagnosis', 'Disposition', 'Parent Alerted'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((visit) => (
                  <tr key={visit._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{visit.studentId?.userId?.name || 'Student'}</td>
                    <td className="px-4 py-3">{visit.symptoms}</td>
                    <td className="px-4 py-3">{visit.diagnosis || '—'}</td>
                    <td className="px-4 py-3">{visit.disposition}</td>
                    <td className="px-4 py-3">{visit.parentAlerted ? 'Yes' : 'No'}</td>
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

export default MedicalVisitsPage;
