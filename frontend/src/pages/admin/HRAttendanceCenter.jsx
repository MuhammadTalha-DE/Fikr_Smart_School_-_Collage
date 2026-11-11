import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Clock3, ScanSearch, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRAttendanceCenter } from '../../services/hrPayrollService';

const HRAttendanceCenter = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await getHRAttendanceCenter();
        setAttendance(response.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const trendRows = useMemo(() => {
    const grouped = new Map();
    (attendance?.teacherAttendance?.dailyTrend || []).forEach((item) => {
      const date = item._id?.date;
      const status = item._id?.status;
      const count = item.count || 0;
      if (!grouped.has(date)) {
        grouped.set(date, { date, present: 0, late: 0, absent: 0, leave: 0, half_day: 0 });
      }
      grouped.get(date)[status] = count;
    });
    return Array.from(grouped.values());
  }, [attendance]);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="p-6 text-center text-slate-500">Loading HR attendance center...</div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={ClipboardCheck} label="Today Marked" value={attendance?.teacherAttendance?.today?.total || 0} helper="Teacher records marked today" tone="blue" />
          <DashboardStatCard icon={Users} label="Present Today" value={attendance?.teacherAttendance?.today?.present || 0} helper={`${attendance?.teacherAttendance?.today?.late || 0} late arrivals`} tone="emerald" />
          <DashboardStatCard icon={Clock3} label="Month Rate" value={`${attendance?.teacherAttendance?.month?.percentage || 0}%`} helper={`${attendance?.teacherAttendance?.month?.total || 0} records this month`} tone="amber" />
          <DashboardStatCard icon={ScanSearch} label="Tracked Roles" value={(attendance?.summary?.trackedRoles || []).length} helper={`${(attendance?.summary?.untrackedRoles || []).length} additional roles ready for future attendance rollout`} tone="violet" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={ClipboardCheck} title="Teacher Attendance Timeline" subtitle="Current live attendance input already usable by HR operations" tone="blue" />
          <div className="space-y-3">
            {trendRows.map((row) => (
              <div key={row.date} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-black text-slate-950">{row.date}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{row.present} present</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{row.late} late</span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">{row.absent} absent</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{(row.leave || 0) + (row.half_day || 0)} leave</span>
                  </div>
                </div>
              </div>
            ))}
            {!trendRows.length ? (
              <div className="py-10 text-center text-sm text-slate-500">No teacher attendance trend is available yet.</div>
            ) : null}
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={ScanSearch} title="Coverage Notes" subtitle="What the current HR attendance center is reading from the live ERP" tone="violet" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tracked now</p>
              <p className="mt-2 text-sm text-slate-700">{(attendance?.summary?.trackedRoles || []).join(', ') || 'teacher'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Next expansion</p>
              <p className="mt-2 text-sm text-slate-700">{(attendance?.summary?.untrackedRoles || []).join(', ')}</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default HRAttendanceCenter;
