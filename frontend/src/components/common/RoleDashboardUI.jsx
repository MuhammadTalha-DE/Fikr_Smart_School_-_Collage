import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const dashboardToneStyles = {
  blue: {
    icon: 'bg-blue-100 text-blue-700',
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    accent: 'text-blue-700',
    progress: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  indigo: {
    icon: 'bg-indigo-100 text-indigo-700',
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    accent: 'text-indigo-700',
    progress: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-violet-500',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    accent: 'text-emerald-700',
    progress: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    soft: 'bg-amber-50 text-amber-700 border-amber-100',
    accent: 'text-amber-700',
    progress: 'bg-amber-500',
    gradient: 'from-amber-400 to-orange-500',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    accent: 'text-rose-700',
    progress: 'bg-rose-500',
    gradient: 'from-rose-500 to-red-500',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700',
    soft: 'bg-violet-50 text-violet-700 border-violet-100',
    accent: 'text-violet-700',
    progress: 'bg-violet-500',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  sky: {
    icon: 'bg-sky-100 text-sky-700',
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
    accent: 'text-sky-700',
    progress: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-500',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700',
    soft: 'bg-slate-50 text-slate-700 border-slate-100',
    accent: 'text-slate-700',
    progress: 'bg-slate-500',
    gradient: 'from-slate-600 to-slate-800',
  },
};

export const DashboardCard = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 ${className}`}>
    {children}
  </div>
);

export const DashboardHero = ({ eyebrow, title, subtitle, meta = [], actions }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 p-6 shadow-sm shadow-slate-200/70">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        {meta.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  </div>
);

export const DashboardSectionHeader = ({ icon: Icon, title, subtitle, action, tone = 'blue' }) => {
  const style = dashboardToneStyles[tone] || dashboardToneStyles.blue;

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <h2 className="text-base font-bold text-slate-950 md:text-lg">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
};

export const DashboardStatCard = ({ icon: Icon, label, value, helper, tone = 'blue' }) => {
  const style = dashboardToneStyles[tone] || dashboardToneStyles.blue;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${style.soft}`}>{label}</span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
};

export const DashboardQuickLink = ({ icon: Icon, label, to, tone = 'blue' }) => {
  const style = dashboardToneStyles[tone] || dashboardToneStyles.blue;

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${style.soft}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
};

export const DashboardProgressBar = ({ value, tone = 'blue', height = 'h-2.5' }) => {
  const style = dashboardToneStyles[tone] || dashboardToneStyles.blue;
  const width = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
      <div className={`h-full rounded-full ${style.progress}`} style={{ width: `${width}%` }} />
    </div>
  );
};

export const DashboardEmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
    {Icon ? (
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
    ) : null}
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {subtitle ? <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{subtitle}</p> : null}
  </div>
);

export const DashboardMiniMetric = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const style = dashboardToneStyles[tone] || dashboardToneStyles.blue;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="truncate text-sm font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
};
