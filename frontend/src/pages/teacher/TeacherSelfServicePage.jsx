import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, FileCheck2, UserCheck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { createTeacherGatePass, createTeacherLeaveRequest, getTeacherSelfServiceCenter } from '../../services/teacherWorkspaceService';

const TeacherSelfServicePage = () => {
  const [data, setData] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [gateForm, setGateForm] = useState({ passType: 'official_duty', exitTime: '', returnTime: '', reason: '' });

  const load = async () => {
    const response = await getTeacherSelfServiceCenter();
    setData(response.data?.data || null);
  };

  useEffect(() => { load(); }, []);

  const submitLeave = async (event) => {
    event.preventDefault();
    try {
      await createTeacherLeaveRequest(leaveForm);
      toast.success('Leave request submitted');
      setLeaveForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const submitGatePass = async (event) => {
    event.preventDefault();
    try {
      await createTeacherGatePass(gateForm);
      toast.success('Gate pass submitted');
      setGateForm({ passType: 'official_duty', exitTime: '', returnTime: '', reason: '' });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit gate pass');
    }
  };

  if (!data) {
    return <Layout role="teacher"><div className="p-6 text-center text-slate-500">Loading teacher self-service...</div></Layout>;
  }

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Teacher HR" title="Teacher HR Self-Service" subtitle="Manage leave requests, gate passes, and your attendance-backed staff workflow from one teacher-facing page." meta={[`${data.summary.attendanceRate || 0}% attendance`, `${data.summary.pendingLeaveRequests || 0} pending leave requests`, `${data.summary.pendingGatePasses || 0} pending gate passes`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={UserCheck} label="Attendance" value={`${data.summary.attendanceRate || 0}%`} helper={`${data.attendance?.present || 0} present records this month`} tone="blue" />
          <DashboardStatCard icon={FileCheck2} label="Approved Leaves" value={data.summary.approvedLeaves || 0} helper="Approved self-service leaves" tone="emerald" />
          <DashboardStatCard icon={CheckCircle2} label="Pending Leaves" value={data.summary.pendingLeaveRequests || 0} helper="Still waiting admin action" tone="amber" />
          <DashboardStatCard icon={CheckCircle2} label="Pending Passes" value={data.summary.pendingGatePasses || 0} helper="Staff movement requests" tone="indigo" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={FileCheck2} title="Leave Request" subtitle="Submit staff leave directly from the teacher portal" tone="blue" />
            <form onSubmit={submitLeave} className="space-y-4">
              {['leaveType', 'fromDate', 'toDate', 'reason'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-700">{field}</label>
                  <input value={leaveForm[field]} onChange={(event) => setLeaveForm({ ...leaveForm, [field]: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                </div>
              ))}
              <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Submit Leave Request</button>
            </form>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={CheckCircle2} title="Gate Pass Request" subtitle="Create a temporary staff exit request through self-service" tone="emerald" />
            <form onSubmit={submitGatePass} className="space-y-4">
              {['passType', 'exitTime', 'returnTime', 'reason'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-700">{field}</label>
                  <input value={gateForm[field]} onChange={(event) => setGateForm({ ...gateForm, [field]: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                </div>
              ))}
              <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Submit Gate Pass</button>
            </form>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherSelfServicePage;
