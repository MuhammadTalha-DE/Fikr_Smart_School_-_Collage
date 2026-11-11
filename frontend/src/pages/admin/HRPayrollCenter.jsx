import { useEffect, useState } from 'react';
import { BadgeDollarSign, ClipboardList, HandCoins, ShieldCheck } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRPayrollCenter } from '../../services/hrPayrollService';

const HRPayrollCenter = () => {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayroll = async () => {
      try {
        const response = await getHRPayrollCenter();
        setPayroll(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    loadPayroll();
  }, []);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="p-6 text-center text-slate-500">Loading payroll center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BadgeDollarSign} label="Payroll Month" value={payroll?.summary?.payrollMonth || 'Current month'} helper="Active cycle context" tone="violet" />
          <DashboardStatCard icon={HandCoins} label="Payable Staff" value={payroll?.summary?.totalStaff || 0} helper="Staff currently visible to payroll operations" tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Contact Ready" value={payroll?.summary?.contactReady || 0} helper={`${payroll?.summary?.setupCoverage || 0}% have both email and phone`} tone="emerald" />
          <DashboardStatCard icon={ClipboardList} label="Attendance Inputs" value={payroll?.summary?.attendanceReadyTeachers || 0} helper="Teacher records available for payroll readiness" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={HandCoins} title="Payroll Components" subtitle="Allowance and deduction building blocks ready for salary structures" tone="blue" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Allowances</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(payroll?.components?.allowances || []).map((item) => (
                    <span key={item.key} className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Deductions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(payroll?.components?.deductions || []).map((item) => (
                    <span key={item.key} className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase text-rose-700">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={ClipboardList} title="Recommended Next Steps" subtitle="The clean order for moving from visibility to full payroll execution" tone="amber" />
            <div className="space-y-3">
              {(payroll?.recommendedActions || []).map((action) => (
                <div key={action} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  {action}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default HRPayrollCenter;
