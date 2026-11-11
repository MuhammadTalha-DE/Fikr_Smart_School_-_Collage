import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Database,
  Filter,
  History,
  RefreshCw,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  getAuditFilterOptions,
  getAuditLogById,
  getAuditLogs,
  getAuditOverview,
} from '../../services/auditService';

const emptyFilters = {
  action: '',
  entity: '',
  role: '',
  module: '',
  search: '',
};

const AuditCenter = () => {
  const [overview, setOverview] = useState(null);
  const [options, setOptions] = useState({ actions: [], entities: [], roles: [], modules: [] });
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const [overviewResponse, optionsResponse, logsResponse] = await Promise.all([
        getAuditOverview(),
        getAuditFilterOptions(),
        getAuditLogs({ ...filters, limit: 25 }),
      ]);
      setOverview(overviewResponse.data.data);
      setOptions(optionsResponse.data.data || { actions: [], entities: [], roles: [], modules: [] });
      setLogs(logsResponse.data.data || []);
      if (logsResponse.data.data?.length) {
        const firstId = logsResponse.data.data[0]._id;
        const detailResponse = await getAuditLogById(firstId);
        setSelectedLog(detailResponse.data.data);
      } else {
        setSelectedLog(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await getAuditLogs({ ...filters, limit: 25 });
      setLogs(response.data.data || []);
      if (response.data.data?.length) {
        const selectedExists = response.data.data.some((item) => item._id === selectedLog?._id);
        if (!selectedExists) {
          const detailResponse = await getAuditLogById(response.data.data[0]._id);
          setSelectedLog(detailResponse.data.data);
        }
      } else {
        setSelectedLog(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.action, filters.entity, filters.module, filters.role, filters.search]);

  const failureRate = useMemo(() => {
    const total = overview?.summary?.total || 0;
    const failures = overview?.summary?.failure || 0;
    return total ? Math.round((failures / total) * 100) : 0;
  }, [overview]);

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Compliance"
          title="Admin Audit Center"
          subtitle="Track who changed what, when it happened, and where system activity is concentrating across the school ERP."
          meta={[
            `${overview?.summary?.total || 0} events in the last ${overview?.windowDays || 30} days`,
            `${overview?.summary?.failure || 0} failures`,
            `${overview?.modules?.length || 0} active modules`,
          ]}
          actions={
            <button
              onClick={loadAudit}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCard icon={History} label="Total" value={overview?.summary?.total || 0} helper="Audited events in selected window" tone="blue" />
          <DashboardStatCard icon={ShieldCheck} label="Success" value={overview?.summary?.success || 0} helper="Completed without warnings or errors" tone="emerald" />
          <DashboardStatCard icon={AlertTriangle} label="Failures" value={overview?.summary?.failure || 0} helper={`${failureRate}% of captured events`} tone="rose" />
          <DashboardStatCard icon={Database} label="Modules" value={overview?.modules?.length || 0} helper="Modules emitting audit events" tone="violet" />
        </div>

        <DashboardCard className="p-5 md:p-6">
          <DashboardSectionHeader icon={Filter} title="Filters" subtitle="Narrow the trail by action, entity, role, or module" tone="amber" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search description or user"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All actions</option>
              {options.actions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.entity} onChange={(event) => setFilters((current) => ({ ...current, entity: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All entities</option>
              {options.entities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All roles</option>
              {options.roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.module} onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All modules</option>
              {options.modules.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </DashboardCard>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={History} title="Event Stream" subtitle={loading ? 'Loading audit records...' : `${logs.length} events loaded`} tone="blue" />

            <div className="space-y-3">
              {logs.map((log) => (
                <button
                  key={log._id}
                  onClick={async () => {
                    const response = await getAuditLogById(log._id);
                    setSelectedLog(response.data.data);
                  }}
                  className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    selectedLog?._id === log._id
                      ? 'border-sky-200 bg-sky-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">{log.action}</span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700">{log.module}</span>
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">{log.entity}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{log.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.performedBy?.name || 'System'} • {log.performedBy?.role || 'system'} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                      log.status === 'failure'
                        ? 'bg-rose-50 text-rose-700'
                        : log.status === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </button>
              ))}

              {!logs.length && !loading ? (
                <div className="py-10 text-center text-sm text-slate-500">No audit logs matched your filters.</div>
              ) : null}
            </div>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={UserCircle2} title="Selected Event" subtitle="Detailed metadata and before/after changes" tone="violet" />

            {selectedLog ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Description</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedLog.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Action', selectedLog.action],
                    ['Entity', selectedLog.entity],
                    ['Module', selectedLog.module],
                    ['Status', selectedLog.status],
                    ['Actor', selectedLog.performedBy?.name || 'System'],
                    ['Role', selectedLog.performedBy?.role || 'system'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Metadata</p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Changes</p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(selectedLog.changes || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">Choose an audit event to inspect the full detail.</div>
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default AuditCenter;
