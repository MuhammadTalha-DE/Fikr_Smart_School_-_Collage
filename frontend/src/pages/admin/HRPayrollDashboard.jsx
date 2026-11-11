import { useEffect, useState } from 'react';
import {
  BellRing,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardHero,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRPayrollOverview } from '../../services/hrPayrollService';

const HRPayrollDashboard = () => {
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
        <div className="p-6 text-center text-slate-500">Loading HR & Payroll module...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Operations"
          title="HR & Payroll Command Center"
          subtitle="Manage staff visibility, department coverage, teacher attendance inputs, payroll readiness, notifications, and audit activity from one dedicated admin module."
          meta={[
            `${overview?.summary?.totalStaff || 0} active staff records`,
            `${overview?.summary?.departments || 0} department groups`,
            `${overview?.teacherAttendance?.month?.percentage || 0}% teacher attendance rate this month`,
            `${overview?.payrollWindow?.monthLabel || 'Current month'} payroll window`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Users} label="Staff Directory" to="/admin/hr-payroll/staff" tone="blue" />
              <DashboardQuickLink icon={ClipboardList} label="Attendance Center" to="/admin/hr-payroll/attendance" tone="emerald" />
              <DashboardQuickLink icon={CreditCard} label="Payroll Center" to="/admin/hr-payroll/payroll" tone="violet" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Users} label="Staff" value={overview?.summary?.totalStaff || 0} helper={`${overview?.summary?.teachers || 0} teachers and ${overview?.summary?.operationsStaff || 0} operations staff`} tone="blue" />
          <DashboardStatCard icon={Building2} label="Departments" value={overview?.summary?.departments || 0} helper="Mapped from existing ERP roles" tone="indigo" />
          <DashboardStatCard icon={ClipboardList} label="Attendance" value={`${overview?.teacherAttendance?.month?.percentage || 0}%`} helper={`${overview?.teacherAttendance?.month?.total || 0} teacher attendance records this month`} tone="emerald" />
          <DashboardStatCard icon={CreditCard} label="Payroll Window" value={String(overview?.payrollWindow?.cycleStatus || 'pending').replaceAll('-', ' ')} helper={`${overview?.payrollWindow?.payableStaff || 0} staff in the current cycle`} tone="violet" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={Building2}
              title="Department Coverage"
              subtitle="Staff distribution across the operational structure"
              tone="indigo"
            />

            <div className="space-y-3">
              {(overview?.departmentBreakdown || []).map((department) => (
                <div key={department.department} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{department.department}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {Object.entries(department.roles || {})
                          .map(([role, count]) => `${count} ${role}`)
                          .join(' | ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
                      {department.total} staff
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={BriefcaseBusiness}
              title="Module Readiness"
              subtitle="What is already active inside the ERP module surface"
              tone="amber"
            />

            <div className="space-y-3">
              {(overview?.moduleReadiness || []).map((item) => (
                <div key={item.key} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status === 'active' ? 'Live' : 'Next'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={TrendingUp}
              title="Newest Staff Records"
              subtitle="Recent accounts already available to HR and payroll operations"
              tone="blue"
            />

            <div className="space-y-3">
              {(overview?.recentStaff || []).map((staff) => (
                <div key={staff._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{staff.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{staff.designation} | {staff.department}</p>
                      <p className="mt-1 text-xs text-slate-400">{staff.email || 'No email'} | {staff.phone || 'No phone'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">
                      {staff.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={BellRing}
              title="Connected ERP Signals"
              subtitle="Notifications and audit activity already flowing into the module context"
              tone="rose"
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recent notifications</p>
                <div className="mt-3 space-y-3">
                  {(overview?.recentSignals?.notifications || []).map((item) => (
                    <div key={item._id} className="rounded-2xl bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.sourceModule} | {item.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recent audit signals</p>
                <div className="mt-3 space-y-3">
                  {(overview?.recentSignals?.audits || []).map((item) => (
                    <div key={item._id} className="rounded-2xl bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{item.action} {item.entity}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.module} | {item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader
            icon={ShieldCheck}
            title="Payroll Readiness"
            subtitle="Current month cycle context and supported component structure"
            tone="violet"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cycle Month</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{overview?.payrollWindow?.monthLabel || 'Current month'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Payable Staff</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{overview?.payrollWindow?.payableStaff || 0}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Attendance-backed Teachers</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{overview?.payrollWindow?.attendanceBackedTeachers || 0}</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default HRPayrollDashboard;
