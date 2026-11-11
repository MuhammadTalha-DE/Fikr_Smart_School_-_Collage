import { useEffect, useState } from 'react';
import { CarFront, DoorOpen, Lock, ShieldAlert, UserRoundCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardEmptyState, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getSecurityGateOverview } from '../../services/securityGateService';

const SecurityGateDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getSecurityGateOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading security command center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Campus Security"
          title="Gate Pass & Security Command Center"
          subtitle="Control school visitor entry, student early departure passes, staff gate passes, vehicle gate logs, and emergency security notices from one campus-access module."
          meta={[
            `${overview?.summary?.activeVisitors || 0} active visitors`,
            `${overview?.summary?.pendingStudentPasses || 0} pending student passes`,
            `${overview?.summary?.pendingStaffPasses || 0} pending staff passes`,
            `${overview?.summary?.activeSecurityNotices || 0} active notices`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Users} label="Visitors" to="/admin/security-gate/visitors" tone="blue" />
              <DashboardQuickLink icon={DoorOpen} label="Gate Passes" to="/admin/security-gate/passes" tone="emerald" />
              <DashboardQuickLink icon={CarFront} label="Vehicle Logs" to="/admin/security-gate/vehicles" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={UserRoundCheck} label="Active Visitors" value={overview?.summary?.activeVisitors || 0} helper="People currently checked in on campus" tone="blue" />
          <DashboardStatCard icon={DoorOpen} label="Student Passes" value={overview?.summary?.pendingStudentPasses || 0} helper="Early departure or temporary exit requests" tone="emerald" />
          <DashboardStatCard icon={ShieldAlert} label="Staff Passes" value={overview?.summary?.pendingStaffPasses || 0} helper="Staff gate pass queue waiting action" tone="indigo" />
          <DashboardStatCard icon={Lock} label="Security Notices" value={overview?.summary?.activeSecurityNotices || 0} helper={`${overview?.summary?.lockdownNotices || 0} lockdown-related notices`} tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Visitor Entry Feed" subtitle="Recent external movement through the school gate" tone="blue" />
            {(overview?.visitors || []).length ? (
              <div className="space-y-3">
                {overview.visitors.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.visitorName}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.purpose} | {item.destination || 'Campus'}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={Users} title="No visitor entries yet" subtitle="Campus visitor movement will appear here once gate logs start recording." />
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Lock} title="Security Notices" subtitle="Lockdown, emergency, and access-control notices" tone="rose" />
            {(overview?.notices || []).length ? (
              <div className="space-y-3">
                {overview.notices.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.noticeType} | {item.message}</p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase text-rose-700">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={ShieldAlert} title="No security notices yet" subtitle="Critical or active gate notices will appear here when published." />
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityGateDashboard;
