import { useEffect, useState } from 'react';
import { HeartPulse, Pill, ShieldAlert, Siren, Stethoscope, UserRoundPlus } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { DashboardCard, DashboardEmptyState, DashboardHero, DashboardQuickLink, DashboardSectionHeader, DashboardStatCard } from '../../components/common/RoleDashboardUI';
import { getMedicalClinicOverview } from '../../services/medicalClinicService';

const MedicalClinicDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getMedicalClinicOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Layout role="admin"><div className="p-6 text-center text-slate-500">Loading clinic command center...</div></Layout>;
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Health Operations"
          title="Medical & Clinic Command Center"
          subtitle="Track student medical profiles, allergies, clinic visits, medicine logs, emergency treatment history, parent alerts, and hostel health incidents in one health-ready module."
          meta={[
            `${overview?.summary?.profiles || 0} medical profiles`,
            `${overview?.summary?.clinicVisits || 0} clinic visits`,
            `${overview?.summary?.openIncidents || 0} open incidents`,
            `${overview?.summary?.parentAlerts || 0} parent alerts`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={UserRoundPlus} label="Profiles" to="/admin/medical-clinic/profiles" tone="blue" />
              <DashboardQuickLink icon={Stethoscope} label="Visits" to="/admin/medical-clinic/visits" tone="emerald" />
              <DashboardQuickLink icon={Pill} label="Medicines" to="/admin/medical-clinic/medicines" tone="amber" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={HeartPulse} label="Profiles" value={overview?.summary?.profiles || 0} helper="Students with detailed clinic records" tone="blue" />
          <DashboardStatCard icon={Stethoscope} label="Visits" value={overview?.summary?.clinicVisits || 0} helper="Recent clinic check-ins and treatments" tone="emerald" />
          <DashboardStatCard icon={Pill} label="Medicine Logs" value={overview?.summary?.medicineLogs || 0} helper="Medicine administration records" tone="indigo" />
          <DashboardStatCard icon={ShieldAlert} label="Open Incidents" value={overview?.summary?.openIncidents || 0} helper={`${overview?.summary?.hostelHealthIncidents || 0} linked to hostel health`} tone="rose" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Stethoscope} title="Recent Clinic Visits" subtitle="Symptoms, diagnosis, and care disposition" tone="emerald" />
            {(overview?.recentVisits || []).length ? (
              <div className="space-y-3">
                {overview.recentVisits.map((visit) => (
                  <div key={visit._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-black text-slate-950">{visit.studentId?.userId?.name || 'Student'}</p>
                    <p className="mt-1 text-xs text-slate-500">{visit.symptoms}</p>
                    <p className="mt-2 text-xs text-slate-500">{visit.disposition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={Stethoscope} title="No clinic visits yet" subtitle="Once health desk activity starts, visit logs will appear here." />
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Siren} title="Health Incidents" subtitle="Hostel, weather, sports, and clinic-linked medical incidents" tone="rose" />
            {(overview?.incidents || []).length ? (
              <div className="space-y-3">
                {overview.incidents.map((incident) => (
                  <div key={incident._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{incident.studentId?.userId?.name || 'Student'}</p>
                        <p className="mt-1 text-xs text-slate-500">{incident.incidentType} | {incident.details}</p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase text-rose-700">{incident.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState icon={ShieldAlert} title="No health incidents" subtitle="Medical incident activity and escalations will appear here when recorded." />
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default MedicalClinicDashboard;
