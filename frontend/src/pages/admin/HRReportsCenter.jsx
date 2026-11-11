import { useEffect, useState } from 'react';
import { BellRing, Building2, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRPayrollOverview } from '../../services/hrPayrollService';

const HRReportsCenter = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await getHRPayrollOverview();
        setOverview(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="p-6 text-center text-slate-500">Loading HR reports center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={Building2} label="Departments" value={overview?.departmentBreakdown?.length || 0} helper="Grouped reporting dimensions" tone="indigo" />
          <DashboardStatCard icon={BellRing} label="Notification Signals" value={overview?.recentSignals?.notifications?.length || 0} helper="Staff-facing communication records" tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Audit Signals" value={overview?.recentSignals?.audits?.length || 0} helper="Operational trace points for admin review" tone="emerald" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={FileSpreadsheet} title="HR Report Surfaces" subtitle="Current reportable views available from the dedicated HR module" tone="violet" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Department rollup</p>
              <div className="mt-3 space-y-3">
                {(overview?.departmentBreakdown || []).map((department) => (
                  <div key={department.department} className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{department.department}</p>
                    <p className="mt-1 text-xs text-slate-500">{department.total} staff</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Available report packs</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-white p-3">Staff directory summary by role and department</div>
                <div className="rounded-2xl bg-white p-3">Teacher attendance pulse for the current month</div>
                <div className="rounded-2xl bg-white p-3">Payroll readiness checklist before cycle generation</div>
                <div className="rounded-2xl bg-white p-3">Notification and audit activity for staff operations</div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default HRReportsCenter;
