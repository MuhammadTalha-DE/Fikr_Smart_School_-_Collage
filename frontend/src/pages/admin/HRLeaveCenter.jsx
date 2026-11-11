import { useEffect, useState } from 'react';
import { ArrowRightLeft, BellRing, CalendarClock, ShieldCheck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRPayrollOverview } from '../../services/hrPayrollService';

const HRLeaveCenter = () => {
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
        <div className="p-6 text-center text-slate-500">Loading leave center...</div>
      </Layout>
    );
  }

  const recentNotifications = overview?.recentSignals?.notifications || [];
  const recentAudits = overview?.recentSignals?.audits || [];

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={CalendarClock} label="Leave Workflow" value="Next" helper="Dedicated staff leave approvals are prepared as the next HR workflow layer" tone="amber" />
          <DashboardStatCard icon={BellRing} label="Notifications" value={recentNotifications.length} helper="Reusable staff communication signals already available" tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Audit Trail" value={recentAudits.length} helper="Admin audit visibility already connected" tone="emerald" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader
            icon={ArrowRightLeft}
            title="Leave Center Rollout"
            subtitle="The module surface is ready; the next addition is staff-specific leave request and approval records."
            tone="amber"
            action={<DashboardQuickLink icon={BellRing} label="Notification Center" to="/admin/notifications" tone="blue" />}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recommended workflow</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>1. Staff submits leave request by department and leave type.</li>
                <li>2. Admin or reporting lead reviews and approves.</li>
                <li>3. Notification Center informs the requester and supervisors.</li>
                <li>4. Payroll cycle consumes approved leave before month close.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current connected systems</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Staff directory for department visibility</li>
                <li>Teacher attendance for absence input support</li>
                <li>Notification Center for approval broadcasts</li>
                <li>Audit Center for approval trail logging</li>
              </ul>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default HRLeaveCenter;
