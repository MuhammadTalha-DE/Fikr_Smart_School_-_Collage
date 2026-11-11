import { useEffect, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardSectionHeader } from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import {
  createStaffGatePass,
  createStudentGatePass,
  getStaffGatePasses,
  getStudentGatePasses,
  updateStaffGatePass,
  updateStudentGatePass,
} from '../../services/securityGateService';

const studentDefault = { studentId: '', passType: 'early_departure', reason: '', guardianName: '', exitTime: '', returnTime: '', status: 'pending' };
const staffDefault = { userId: '', passType: 'official_duty', reason: '', exitTime: '', returnTime: '', status: 'pending' };

const SecurityPassesPage = () => {
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [studentPasses, setStudentPasses] = useState([]);
  const [staffPasses, setStaffPasses] = useState([]);
  const [studentForm, setStudentForm] = useState(studentDefault);
  const [staffForm, setStaffForm] = useState(staffDefault);

  const load = async () => {
    const [studentsRes, usersRes, studentPassesRes, staffPassesRes] = await Promise.all([
      api.get('/students'),
      api.get('/users'),
      getStudentGatePasses(),
      getStaffGatePasses(),
    ]);
    setStudents(studentsRes.data?.students || studentsRes.data || []);
    setStaff((usersRes.data || []).filter((item) => item.role !== 'student' && item.role !== 'parent'));
    setStudentPasses(studentPassesRes.data?.data || []);
    setStaffPasses(staffPassesRes.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={DoorOpen} title="Student Gate Passes" subtitle="Early departure and temporary exit approvals" tone="emerald" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await createStudentGatePass(studentForm);
                  toast.success('Student gate pass created');
                  setStudentForm(studentDefault);
                  await load();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Could not save student pass');
                }
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <select value={studentForm.studentId} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                <option value="">Select student</option>
                {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}
              </select>
              <select value={studentForm.passType} onChange={(e) => setStudentForm({ ...studentForm, passType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['early_departure', 'temporary_exit'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={studentForm.reason} onChange={(e) => setStudentForm({ ...studentForm, reason: e.target.value })} placeholder="Reason" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
              <input value={studentForm.guardianName} onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })} placeholder="Guardian name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input type="datetime-local" value={studentForm.exitTime} onChange={(e) => setStudentForm({ ...studentForm, exitTime: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">Create Student Pass</button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={DoorOpen} title="Staff Gate Passes" subtitle="Track official duty and temporary staff exits" tone="indigo" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await createStaffGatePass(staffForm);
                  toast.success('Staff gate pass created');
                  setStaffForm(staffDefault);
                  await load();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Could not save staff pass');
                }
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <select value={staffForm.userId} onChange={(e) => setStaffForm({ ...staffForm, userId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                <option value="">Select staff</option>
                {staff.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.role})</option>)}
              </select>
              <select value={staffForm.passType} onChange={(e) => setStaffForm({ ...staffForm, passType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                {['official_duty', 'temporary_exit', 'personal'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={staffForm.reason} onChange={(e) => setStaffForm({ ...staffForm, reason: e.target.value })} placeholder="Reason" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
              <input type="datetime-local" value={staffForm.exitTime} onChange={(e) => setStaffForm({ ...staffForm, exitTime: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Create Staff Pass</button>
            </form>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student', 'Type', 'Exit', 'Status', 'Action'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentPasses.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.studentId?.userId?.name || 'Student'}</td>
                      <td className="px-4 py-3">{item.passType}</td>
                      <td className="px-4 py-3">{item.exitTime ? new Date(item.exitTime).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">{item.status}</td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' ? (
                          <button type="button" onClick={async () => { await updateStudentGatePass(item._id, { status: 'approved' }); toast.success('Student pass approved'); await load(); }} className="text-blue-600 hover:text-blue-800">Approve</button>
                        ) : '—'}
                      </td>
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
                    {['Staff', 'Type', 'Exit', 'Status', 'Action'].map((label) => <th key={label} className="px-4 py-3 text-left font-semibold text-slate-700">{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffPasses.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.userId?.name || 'Staff'}</td>
                      <td className="px-4 py-3">{item.passType}</td>
                      <td className="px-4 py-3">{item.exitTime ? new Date(item.exitTime).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">{item.status}</td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' ? (
                          <button type="button" onClick={async () => { await updateStaffGatePass(item._id, { status: 'approved' }); toast.success('Staff pass approved'); await load(); }} className="text-blue-600 hover:text-blue-800">Approve</button>
                        ) : '—'}
                      </td>
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

export default SecurityPassesPage;
