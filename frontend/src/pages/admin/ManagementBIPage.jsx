import { useEffect, useState } from 'react';
import { BarChart3, GraduationCap, Landmark, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getManagementBICenter } from '../../services/adminOperationsService';

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const ManagementBIPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getManagementBICenter();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading BI center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Executive Reporting" title="Management Reports & BI Center" subtitle="Monitor platform, academics, finance, approvals, complaints, and continuity from a single reporting command layer." meta={[`${data.summary.platformUsers || 0} users`, `${data.summary.students || 0} students`, `${data.summary.pendingApprovals || 0} pending approvals`, `${money(data.summary.monthlyCollections)} monthly collections`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Users" value={data.summary.platformUsers || 0} helper={`${data.summary.teachers || 0} teachers on platform`} tone="blue" />
          <DashboardStatCard icon={GraduationCap} label="Students" value={data.summary.students || 0} helper={`${data.summary.classes || 0} active classes`} tone="indigo" />
          <DashboardStatCard icon={Landmark} label="Collections" value={money(data.summary.monthlyCollections)} helper="Current month receipts" tone="emerald" />
          <DashboardStatCard icon={BarChart3} label="Continuity Score" value={data.summary.continuityScoreAverage || 0} helper={`${data.summary.openComplaints || 0} open hostel complaints`} tone="amber" />
        </div>
        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={BarChart3} title="KPI Board" subtitle="High-level ERP indicators for management review" tone="blue" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data.kpis || []).map((item) => (
              <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-black text-slate-950">{typeof item.value === 'number' && item.key === 'collections' ? money(item.value) : item.value}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default ManagementBIPage;
