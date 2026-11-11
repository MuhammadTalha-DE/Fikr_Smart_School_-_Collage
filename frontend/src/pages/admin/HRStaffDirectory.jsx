import { useEffect, useMemo, useState } from 'react';
import { Building2, Search, UserRoundCheck, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { getHRStaffDirectory } from '../../services/hrPayrollService';

const HRStaffDirectory = () => {
  const [search, setSearch] = useState('');
  const [directory, setDirectory] = useState({ total: 0, records: [], departments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await getHRStaffDirectory(search ? { search } : {});
        setDirectory(response.data?.data || { total: 0, records: [], departments: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const teacherCount = useMemo(
    () => directory.records.filter((item) => item.role === 'teacher').length,
    [directory.records]
  );

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard icon={Users} label="Directory" value={directory.total || 0} helper="Staff profiles discoverable by HR" tone="blue" />
          <DashboardStatCard icon={UserRoundCheck} label="Teachers" value={teacherCount} helper="Academic staff mapped from teacher profiles" tone="emerald" />
          <DashboardStatCard icon={Building2} label="Departments" value={directory.departments?.length || 0} helper="Operational groupings available to admin" tone="indigo" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Search} title="Staff Directory" subtitle="Search staff records already connected to the ERP user base" tone="blue" />

          <div className="mb-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, username, phone, or role"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading staff directory...</div>
          ) : (
            <div className="space-y-3">
              {directory.records.map((staff) => (
                <div key={staff._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{staff.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{staff.designation} | {staff.department}</p>
                      <p className="mt-1 text-xs text-slate-400">{staff.email || 'No email'} | {staff.phone || 'No phone'} | {staff.employeeCode}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{staff.role}</span>
                      {staff.subjectCount ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase text-blue-700">{staff.subjectCount} subjects</span>
                      ) : null}
                      {staff.classCount ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700">{staff.classCount} classes</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!directory.records.length ? (
                <div className="py-10 text-center text-sm text-slate-500">No staff records match the current search.</div>
              ) : null}
            </div>
          )}
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default HRStaffDirectory;
