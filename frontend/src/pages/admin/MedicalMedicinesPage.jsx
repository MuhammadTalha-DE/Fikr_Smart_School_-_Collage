import { useEffect, useState } from 'react';
import { Pill, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { createHealthIncident, createMedicineLog, getHealthIncidents, getMedicineLogs } from '../../services/medicalClinicService';

const medicineFormDefault = { studentId: '', medicineName: '', dosage: '', quantity: 1, notes: '' };
const incidentFormDefault = { studentId: '', incidentType: 'hostel', severity: 'medium', details: '', actionTaken: '', parentAlerted: false, status: 'open' };

const MedicalMedicinesPage = () => {
  const [students, setStudents] = useState([]);
  const [medicineForm, setMedicineForm] = useState(medicineFormDefault);
  const [incidentForm, setIncidentForm] = useState(incidentFormDefault);
  const [medicines, setMedicines] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const load = async () => {
    const [studentsRes, medicinesRes, incidentsRes] = await Promise.all([
      api.get('/students'),
      getMedicineLogs(),
      getHealthIncidents(),
    ]);
    setStudents(studentsRes.data?.students || studentsRes.data || []);
    setMedicines(medicinesRes.data?.data || []);
    setIncidents(incidentsRes.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Pill} title="Medicine Log" subtitle="Track medicine administration by student" tone="indigo" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await createMedicineLog(medicineForm);
                  toast.success('Medicine log created');
                  setMedicineForm(medicineFormDefault);
                  await load();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Could not save medicine log');
                }
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <select value={medicineForm.studentId} onChange={(e) => setMedicineForm({ ...medicineForm, studentId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                <option value="">Select student</option>
                {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}
              </select>
              <input value={medicineForm.medicineName} onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })} placeholder="Medicine name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input value={medicineForm.dosage} onChange={(e) => setMedicineForm({ ...medicineForm, dosage: e.target.value })} placeholder="Dosage" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input type="number" value={medicineForm.quantity} onChange={(e) => setMedicineForm({ ...medicineForm, quantity: Number(e.target.value || 1) })} placeholder="Qty" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input value={medicineForm.notes} onChange={(e) => setMedicineForm({ ...medicineForm, notes: e.target.value })} placeholder="Notes" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
              <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Save Medicine Log</button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ShieldAlert} title="Health Incident Log" subtitle="Record weather, hostel, clinic, and emergency incidents" tone="rose" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await createHealthIncident(incidentForm);
                  toast.success('Health incident saved');
                  setIncidentForm(incidentFormDefault);
                  await load();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Could not save incident');
                }
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <select value={incidentForm.studentId} onChange={(e) => setIncidentForm({ ...incidentForm, studentId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                <option value="">Select student</option>
                {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}
              </select>
              <select value={incidentForm.incidentType} onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['clinic', 'hostel', 'sports', 'weather', 'emergency'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['low', 'medium', 'high', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={incidentForm.status} onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['open', 'monitoring', 'resolved'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={incidentForm.details} onChange={(e) => setIncidentForm({ ...incidentForm, details: e.target.value })} placeholder="Incident details" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
              <input value={incidentForm.actionTaken} onChange={(e) => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })} placeholder="Action taken" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={incidentForm.parentAlerted} onChange={(e) => setIncidentForm({ ...incidentForm, parentAlerted: e.target.checked })} />
                Parent alerted
              </label>
              <button type="submit" className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700">Save Incident</button>
            </form>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student', 'Medicine', 'Dosage', 'Qty'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.studentId?.userId?.name || 'Student'}</td>
                      <td className="px-4 py-3">{item.medicineName}</td>
                      <td className="px-4 py-3">{item.dosage}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          <DashboardCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student', 'Type', 'Severity', 'Status'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.studentId?.userId?.name || 'Student'}</td>
                      <td className="px-4 py-3">{item.incidentType}</td>
                      <td className="px-4 py-3">{item.severity}</td>
                      <td className="px-4 py-3">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default MedicalMedicinesPage;
