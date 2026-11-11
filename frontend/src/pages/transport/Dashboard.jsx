import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bus,
  CloudSun,
  Clock3,
  MapPinned,
  Route,
  Send,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { getTransportWeatherSummary } from '../../services/weatherService';

const initialComposer = {
  routeId: '',
  vehicleId: '',
  delayMinutes: 10,
  severity: 'medium',
  reason: '',
};

const toneByRisk = {
  low: 'emerald',
  medium: 'amber',
  high: 'rose',
};

const TransportDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [delayAlerts, setDelayAlerts] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [composer, setComposer] = useState(initialComposer);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    const [overviewRes, alertsRes, weatherRes] = await Promise.allSettled([
      api.get('/transport/dashboard/overview'),
      api.get('/transport/delay-alerts'),
      getTransportWeatherSummary(),
    ]);

    if (overviewRes.status === 'fulfilled') {
      setOverview(overviewRes.value.data?.data || null);
    }
    if (alertsRes.status === 'fulfilled') {
      setDelayAlerts(alertsRes.value.data?.data || []);
    }
    if (weatherRes.status === 'fulfilled') {
      setWeatherSummary(weatherRes.value.data?.data || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const routes = useMemo(
    () => (overview?.rosterPreview || [])
      .map((item) => item.route)
      .filter(Boolean)
      .filter((route, index, list) => list.findIndex((candidate) => candidate?._id === route?._id) === index),
    [overview]
  );

  const vehicles = useMemo(
    () => (overview?.fleet || []).filter(Boolean),
    [overview]
  );

  const riskTone = toneByRisk[overview?.transportRisk?.overallRisk] || 'blue';
  const weatherAdvice = weatherSummary?.advice || [];

  const handleComposerChange = (field, value) => {
    setComposer((current) => ({ ...current, [field]: value }));
  };

  const submitDelayAlert = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/transport/delay-alerts', composer);
      setComposer(initialComposer);
      await loadDashboard();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="transport">
        <div className="p-6 text-center text-slate-500">Loading transport dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout role="transport">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Transport Operations"
          title="Transport Command Center"
          subtitle="Run the fleet with live route visibility, campus weather risk, rider coverage, and instant delay broadcasts tied into the Notification Center."
          meta={[
            `${overview?.summary?.activeRoutes || 0} active routes`,
            `${overview?.summary?.activeVehicles || 0} active vehicles`,
            `${overview?.summary?.activeAllocations || 0} active riders`,
            `${delayAlerts.length} recent transport alerts`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Bus} label="Fleet Operations" to="/transport/operations" tone="blue" />
              <DashboardQuickLink icon={MapPinned} label="Roster & Trips" to="/transport/roster" tone="indigo" />
              <DashboardQuickLink icon={CloudSun} label="Transport Weather" to="/transport/weather" tone="sky" />
              <DashboardQuickLink icon={Workflow} label="Workflow Center" to="/transport/workflows" tone="violet" />
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={Route} label="Routes" value={overview?.summary?.activeRoutes || 0} helper={`${overview?.summary?.totalRoutes || 0} configured in system`} tone="blue" />
          <DashboardStatCard icon={Bus} label="Vehicles" value={overview?.summary?.activeVehicles || 0} helper={`${overview?.summary?.totalVehicles || 0} registered buses`} tone="indigo" />
          <DashboardStatCard icon={Users} label="Active Riders" value={overview?.summary?.activeAllocations || 0} helper={`${overview?.summary?.feeEnabledAllocations || 0} with monthly transport fee`} tone="emerald" />
          <DashboardStatCard icon={AlertTriangle} label="Risk Level" value={String(overview?.transportRisk?.overallRisk || 'low').toUpperCase()} helper={overview?.transportRisk?.suggestedAction || 'No action needed'} tone={riskTone} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={AlertTriangle}
                title="Weather Risk Snapshot"
                subtitle="Current conditions influencing transport readiness"
                tone={riskTone}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Condition</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{overview?.latestWeather?.condition || 'Unknown'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Visibility</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{overview?.latestWeather?.visibility ?? '--'} km</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Wind Speed</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{overview?.latestWeather?.windSpeed ?? '--'} km/h</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(overview?.transportRisk?.risks || []).length ? (
                  overview.transportRisk.risks.map((risk, index) => (
                    <div key={`${risk.factor}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-950">{risk.factor}</p>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 uppercase">
                          {risk.risk}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{risk.advice}</p>
                    </div>
                  ))
                ) : (
                  <DashboardEmptyState icon={ShieldCheck} title="No transport weather risk" subtitle="Current weather conditions do not require extra route controls." />
                )}
              </div>

              {weatherAdvice.length ? (
                <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-600">Weather guidance</p>
                  <p className="mt-2 text-sm text-slate-700">{weatherAdvice[0]?.text}</p>
                </div>
              ) : null}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={MapPinned}
                title="Roster Preview"
                subtitle="Current active student allocations with pickup context"
                tone="indigo"
                action={<DashboardQuickLink icon={MapPinned} label="Open full roster" to="/transport/roster" tone="indigo" />}
              />

              {(overview?.rosterPreview || []).length ? (
                <div className="space-y-3">
                  {overview.rosterPreview.slice(0, 8).map((item) => (
                    <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-950">{item.student?.userId?.name || item.student?.admissionNumber || 'Student'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.route?.name || 'Route pending'} | Pickup: {item.pickupStopName || item.pickupStop || 'Unknown'}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500">
                          Bus: <span className="font-semibold text-slate-700">{item.vehicle?.registrationNumber || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Users} title="No active transport allocations" subtitle="Rider assignments will appear here once routes are linked." />
              )}
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Send} title="Broadcast Delay Alert" subtitle="Send a real transport delay notice into the Notification Center" tone="amber" />
              <form className="space-y-3" onSubmit={submitDelayAlert}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    value={composer.routeId}
                    onChange={(event) => handleComposerChange('routeId', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="">All affected routes</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>{route.name}</option>
                    ))}
                  </select>
                  <select
                    value={composer.vehicleId}
                    onChange={(event) => handleComposerChange('vehicleId', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="">All affected vehicles</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>{vehicle.registrationNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    min="1"
                    value={composer.delayMinutes}
                    onChange={(event) => handleComposerChange('delayMinutes', Number(event.target.value))}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    placeholder="Delay minutes"
                  />
                  <select
                    value={composer.severity}
                    onChange={(event) => handleComposerChange('severity', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <textarea
                  value={composer.reason}
                  onChange={(event) => handleComposerChange('reason', event.target.value)}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  placeholder="Reason for delay, route condition, or driver advisory"
                />

                <button
                  type="submit"
                  disabled={submitting || (!composer.routeId && !composer.vehicleId)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending...' : 'Send Delay Alert'}
                </button>
              </form>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Clock3} title="Recent Transport Alerts" subtitle="Latest delay and route advisories sent through the ERP" tone="rose" />
              {delayAlerts.length ? (
                <div className="space-y-3">
                  {delayAlerts.slice(0, 6).map((alert) => (
                    <div key={alert._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{alert.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{alert.message}</p>
                        </div>
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase text-rose-700">
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Clock3} title="No transport alerts sent yet" subtitle="Delay or route advisories created here will appear in this panel." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Bus} title="Fleet Snapshot" subtitle="Quick vehicle reference for active transport staff" tone="emerald" />
              {vehicles.length ? (
                <div className="space-y-3">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <div key={vehicle._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{vehicle.registrationNumber}</p>
                          <p className="mt-1 text-xs text-slate-500">{vehicle.driverName || 'Driver not assigned'} | Capacity {vehicle.capacity || 0}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${vehicle.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Bus} title="No fleet records" subtitle="Vehicle inventory will appear here once transport assets are registered." />
              )}
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransportDashboard;
