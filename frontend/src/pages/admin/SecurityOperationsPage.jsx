import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getSecurityOperations } from '../../services/adminOperationsService';

const SecurityOperationsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getSecurityOperations();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading security operations...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Campus Access" title="Security Operations Dashboard" subtitle="Watch live gate activity, security notices, visitor flow, and access-control risk from the admin operations layer." meta={[`${data.summary.activeVisitors || 0} active visitors`, `${data.summary.pendingStudentPasses || 0} student passes`, `${data.summary.pendingStaffPasses || 0} staff passes`, `${data.summary.activeSecurityNotices || 0} notices`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Visitors" value={data.summary.activeVisitors || 0} helper="Currently active on campus" tone="blue" />
          <DashboardStatCard icon={UserRoundCheck} label="Student Passes" value={data.summary.pendingStudentPasses || 0} helper="Awaiting approval or use" tone="amber" />
          <DashboardStatCard icon={ShieldCheck} label="Staff Passes" value={data.summary.pendingStaffPasses || 0} helper="Staff exits needing review" tone="indigo" />
          <DashboardStatCard icon={Lock} label="Notices" value={data.summary.activeSecurityNotices || 0} helper={`${data.summary.lockdownNotices || 0} lockdown-related`} tone="rose" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Visitor Activity" subtitle="Recent external movement into campus" tone="blue" />
            <div className="space-y-3">
              {(data.visitors || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.visitorName}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.purpose} | {item.destination || 'Campus'}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.status}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Lock} title="Security Notices" subtitle="Active operational notices and lockdown signals" tone="rose" />
            <div className="space-y-3">
              {(data.notices || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.noticeType} | {item.status}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityOperationsPage;
