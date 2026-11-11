import { useEffect, useState } from 'react';
import { HeartPulse, Siren, Stethoscope } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardHero, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getClinicOperations } from '../../services/adminOperationsService';

const ClinicOperationsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getClinicOperations();
      setData(response.data?.data || null);
    };
    load();
  }, []);

  if (!data) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading clinic operations...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero eyebrow="Health Desk" title="Clinic Operations Dashboard" subtitle="Monitor clinic volume, health incidents, parent alerts, and critical medical escalations from the admin operations layer." meta={[`${data.summary.profiles || 0} profiles`, `${data.summary.clinicVisits || 0} visits`, `${data.summary.openIncidents || 0} open incidents`, `${data.summary.criticalIncidents || 0} critical incidents`]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={HeartPulse} label="Profiles" value={data.summary.profiles || 0} helper="Student health records tracked" tone="blue" />
          <DashboardStatCard icon={Stethoscope} label="Visits" value={data.summary.clinicVisits || 0} helper="Recent clinic treatment volume" tone="emerald" />
          <DashboardStatCard icon={Siren} label="Open Incidents" value={data.summary.openIncidents || 0} helper="Active issues needing follow-up" tone="amber" />
          <DashboardStatCard icon={Siren} label="Critical" value={data.summary.criticalIncidents || 0} helper="Leadership-level escalations" tone="rose" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Stethoscope} title="Recent Clinic Visits" subtitle="Symptoms, disposition, and recent desk activity" tone="blue" />
            <div className="space-y-3">
              {(data.recentVisits || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.symptoms}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.disposition}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Siren} title="Critical Incident Feed" subtitle="High-severity medical events requiring rapid action" tone="rose" />
            <div className="space-y-3">
              {(data.criticalIncidents || []).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-black text-slate-950">{item.studentId?.userId?.name || 'Student'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.incidentType} | {item.severity}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.details}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default ClinicOperationsPage;
