import { useEffect, useState } from 'react';
import { BellRing, ClipboardList, FileCheck2, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getStaffSelfServiceOversight } from '../../services/adminOperationsService';

const StaffSelfServiceOversightPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getStaffSelfServiceOversight();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading staff self-service oversight...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Staff Operations" title="Staff Self-Service Oversight" subtitle="Watch teacher and staff self-service activity across leave, gate passes, attendance readiness, and parent meeting flow." meta={[`${data.summary.totalStaff || 0} staff`, `${data.summary.pendingLeaveRequests || 0} pending leave requests`, `${data.summary.pendingGatePasses || 0} pending gate passes`, `${data.summary.scheduledPTMs || 0} scheduled PTMs`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Staff" value={data.summary.totalStaff || 0} helper="HR-backed active staff records" tone="blue" />
          <DashboardStatCard icon={FileCheck2} label="Leave Requests" value={data.summary.pendingLeaveRequests || 0} helper="Waiting approval" tone="amber" />
          <DashboardStatCard icon={ClipboardList} label="Gate Passes" value={data.summary.pendingGatePasses || 0} helper="Staff movement awaiting review" tone="indigo" />
          <DashboardStatCard icon={BellRing} label="PTMs" value={data.summary.scheduledPTMs || 0} helper="Scheduled parent meetings in teacher flow" tone="rose" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={FileCheck2} title="Leave Requests" subtitle="Recent staff requests flowing through self-service" tone="amber" />
            <div className="space-y-3">
              {(data.leaveRequests || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.userId?.name || 'Staff'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.leaveType} | {item.status}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.fromDate).toLocaleDateString()} to {new Date(item.toDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Gate Pass Requests" subtitle="Movement requests created by staff through self-service" tone="indigo" />
            <div className="space-y-3">
              {(data.gatePasses || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.userId?.name || 'Staff'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.passType} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default StaffSelfServiceOversightPage;
