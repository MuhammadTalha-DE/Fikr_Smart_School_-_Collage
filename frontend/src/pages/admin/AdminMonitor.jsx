import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, BookOpen, Bus, CalendarDays, CheckCircle2, Clock3, HeartPulse, MessageSquare, RefreshCw, Shield, Users, Wifi, WifiOff } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const emptyDashboard = {
  systemStatus: { autoRefreshSeconds: 30 },
  overview: {
    people: {}, academics: {}, finance: {}, library: {}, transport: {}, hostel: {}, safety: {}, admissions: {}, communication: {},
  },
  attentionItems: [], recentActivities: [],
};

const number = (value) => Number(value || 0).toLocaleString();
const currency = (value) => `PKR ${number(value)}`;

function Metric({ icon: Icon, label, value, note, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700',
  };
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{label}</p><p className="mt-3 text-3xl font-black text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{note}</p></div><span className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={21}/></span></div>
  </div>;
}

const AdminMonitor = () => {
  const { socket, isConnected } = useSocket();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', mongodb: 'checking' });

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const [dashboardResult, healthResult] = await Promise.allSettled([
        api.get('/dashboard/admin'),
        api.get('/health'),
      ]);
      if (healthResult.status === 'fulfilled') setSystemHealth(healthResult.value.data);
      else setSystemHealth({ status: 'unavailable', mongodb: 'unknown' });
      if (dashboardResult.status === 'rejected') throw dashboardResult.reason;
      const { data } = dashboardResult.value;
      setDashboard({ ...emptyDashboard, ...data, overview: { ...emptyDashboard.overview, ...data?.overview } });
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not retrieve current system activity.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    refresh(true);
    const interval = window.setInterval(() => refresh(), (dashboard.systemStatus.autoRefreshSeconds || 30) * 1000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refresh, dashboard.systemStatus.autoRefreshSeconds]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = () => refresh();
    socket.on('dashboard:refresh', onUpdate);
    return () => socket.off('dashboard:refresh', onUpdate);
  }, [socket, refresh]);

  const { overview } = dashboard;
  const modules = useMemo(() => [
    { name: 'People & enrollment', icon: Users, detail: `${number(overview.people.students)} students · ${number(overview.people.teachers)} teachers`, to: '/admin/students', signal: 'Directory data' },
    { name: 'Academics & attendance', icon: BookOpen, detail: `${number(overview.academics.examsUpcoming)} upcoming exams · ${number(overview.academics.attendanceRate)}% attendance`, to: '/admin/analytics', signal: 'Academic data' },
    { name: 'Finance', icon: Activity, detail: `${currency(overview.finance.monthlyCollection)} collected this month`, to: '/admin/accounts-ledger', signal: 'Collection data' },
    { name: 'Library', icon: BookOpen, detail: `${number(overview.library.issuedLoans)} loans · ${number(overview.library.overdueLoans)} overdue`, to: '/library/dashboard', signal: 'Circulation data' },
    { name: 'Transport', icon: Bus, detail: `${number(overview.transport.activeVehicles)} active vehicles · ${number(overview.transport.activeRoutes)} routes`, to: '/admin/transport', signal: 'Fleet data' },
    { name: 'Hostel', icon: HeartPulse, detail: `${number(overview.hostel.activeResidents)} residents · ${number(overview.hostel.openComplaints)} open complaints`, to: '/admin/hostel-analytics', signal: 'Residence data' },
    { name: 'Safety & incidents', icon: Shield, detail: `${number(overview.safety.activeAlerts)} active alerts · ${number(overview.safety.pendingIncidents)} unresolved incidents`, to: '/admin/safety-dashboard', signal: overview.safety.criticalAlerts > 0 ? 'Attention needed' : 'Safety data' },
    { name: 'Admissions', icon: CalendarDays, detail: `${number(overview.admissions.pending)} applications pending`, to: '/admin/admissions', signal: 'Admissions data' },
    { name: 'Communication', icon: MessageSquare, detail: `${number(overview.communication.unreadMessages)} unread · ${number(overview.communication.messagesLast7Days)} messages this week`, to: '/admin/messages', signal: 'Messaging data' },
  ], [overview]);
  const attention = (dashboard.attentionItems || []).filter((item) => Number(item.count || 0) > 0);
  const activities = dashboard.recentActivities || [];

  return <Layout role="admin"><main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] text-blue-200">Admin oversight</p><h1 className="mt-2 text-3xl font-black md:text-4xl">School System Monitor</h1><p className="mt-2 max-w-2xl text-sm text-blue-100/80">A live overview of activity and operational signals across the school’s core modules.</p></div>
        <button onClick={() => refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/> Refresh</button>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">{systemHealth.status === 'OK' && !error ? <CheckCircle2 size={16}/> : <WifiOff size={16}/>} {systemHealth.status === 'OK' && !error ? 'API connected' : 'API needs attention'}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">{systemHealth.mongodb === 'connected' ? <CheckCircle2 size={16}/> : <WifiOff size={16}/>} Database {systemHealth.mongodb}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">{isConnected ? <Wifi size={16}/> : <WifiOff size={16}/>} {isConnected ? 'Live updates connected' : 'Live updates disconnected'}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><Clock3 size={16}/> {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first update'}</span>
      </div>
    </section>

    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error} The last successful snapshot is shown where available.</div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="People" value={number(overview.people.totalUsers)} note={`${number(overview.people.students)} students · ${number(overview.people.teachers)} teachers`} />
      <Metric icon={Activity} label="Attendance" value={`${number(overview.academics.attendanceRate)}%`} note="Latest recorded attendance" tone="emerald" />
      <Metric icon={AlertTriangle} label="Attention items" value={number(attention.length)} note={`${number(overview.safety.criticalAlerts)} critical safety alerts`} tone={attention.length ? 'amber' : 'emerald'} />
      <Metric icon={Wifi} label="Live connection" value={isConnected ? 'Online' : 'Polling'} note={`Refreshes every ${dashboard.systemStatus.autoRefreshSeconds || 30} seconds`} tone={isConnected ? 'emerald' : 'violet'} />
    </div>

    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-5"><h2 className="text-xl font-black text-slate-900">Module monitor</h2><p className="mt-1 text-sm text-slate-500">Current operational indicators from the admin dashboard snapshot.</p></div>
      {loading ? <div className="py-12 text-center text-slate-500">Loading school system snapshot…</div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{modules.map(({ name, icon: Icon, detail, to, signal }) => <Link key={name} to={to} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Icon size={19}/></span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${signal === 'Attention needed' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{signal}</span></div><h3 className="mt-3 font-bold text-slate-900">{name}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></Link>)}</div>}
    </section>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"><h2 className="text-xl font-black text-slate-900">Needs attention</h2><p className="mt-1 text-sm text-slate-500">Open admin follow-ups surfaced across the system.</p><div className="mt-4 space-y-3">{attention.length ? attention.slice(0, 6).map((item, index) => <Link to={item.href || '/admin/dashboard'} key={item.key || item.title || index} className="flex items-start gap-3 rounded-2xl bg-amber-50/70 p-3"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700"/><div><p className="text-sm font-bold text-slate-800">{item.title || item.label || 'Follow-up required'} <span className="ml-1 text-amber-800">({number(item.count)})</span></p><p className="mt-0.5 text-xs text-slate-600">{item.description || item.message || item.detail || 'Review this item in its module.'}</p></div></Link>) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">No outstanding attention items in the latest snapshot.</p>}</div></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"><h2 className="text-xl font-black text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Latest recorded school activity.</p><div className="mt-4 space-y-3">{activities.length ? activities.slice(0, 6).map((item, index) => <div key={item.id || item._id || index} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0"><span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500"/><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{item.title || item.description || item.action || 'System activity'}</p><p className="mt-1 text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : item.time || item.module || 'Recent update'}</p></div></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No recent activity is available in the latest snapshot.</p>}</div></section>
    </div>
  </main></Layout>;
};

export default AdminMonitor;
