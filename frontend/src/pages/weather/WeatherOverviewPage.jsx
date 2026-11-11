import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bus,
  CloudSun,
  Droplets,
  Gauge,
  RefreshCw,
  Shield,
  Siren,
  Thermometer,
  Wind,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import AQIWidget from '../../components/weather/AQIWidget';
import HourlyForecast from '../../components/weather/HourlyForecast';
import WeatherAlertCard from '../../components/weather/WeatherAlertCard';
import WeatherCharts from '../../components/weather/WeatherCharts';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherHeroCard from '../../components/weather/WeatherHeroCard';
import WeatherImpactCharts from '../../components/weather/WeatherImpactCharts';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherSystemHealth from '../../components/weather/WeatherSystemHealth';
import WeeklyForecast from '../../components/weather/WeeklyForecast';
import useWeatherSocket from '../../hooks/useWeatherSocket';
import {
  getAdminWeatherDashboard,
  getIntegratedWeatherDashboard,
  refreshWeatherData,
} from '../../services/weatherService';
import {
  buildHourlyForecast,
  buildWeatherChartSeries,
  buildWeeklyForecast,
  formatAlertAudience,
  getCampusSafetyStatus,
  getRoleWeatherGuidance,
} from './weatherPageHelpers';

const metricCards = (current, aqi) => [
  { label: 'Temperature', value: `${Math.round(current?.temperature ?? 0)} C`, icon: Thermometer, tone: 'text-rose-600 bg-rose-50' },
  { label: 'Humidity', value: `${Math.round(current?.humidity ?? 0)}%`, icon: Droplets, tone: 'text-cyan-600 bg-cyan-50' },
  { label: 'Wind Speed', value: `${Math.round(current?.windSpeed ?? 0)} km/h`, icon: Wind, tone: 'text-sky-600 bg-sky-50' },
  { label: 'AQI', value: aqi?.aqi ? `${aqi.aqi}` : 'N/A', icon: Gauge, tone: 'text-amber-600 bg-amber-50' },
];

const WeatherOverviewPage = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const live = useWeatherSocket({ enabled: true });

  const loadWeather = useCallback(async () => {
    try {
      setError('');
      const [snapshotRes, dashboardRes] = await Promise.all([
        getIntegratedWeatherDashboard(),
        getAdminWeatherDashboard(),
      ]);

      setSnapshot(snapshotRes.data.data);
      setDashboard(dashboardRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load the weather command center.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWeatherData();
    } catch (err) {
      setError(err.response?.data?.message || 'Refresh failed.');
      setRefreshing(false);
      return;
    }
    loadWeather();
  };

  const current = live.liveWeather || snapshot?.currentWeather || dashboard?.current;
  const aqi = live.liveAQI || snapshot?.aqi || dashboard?.aqi;
  const alerts = dashboard?.alerts || snapshot?.alerts || [];
  const forecast = snapshot?.forecast || dashboard?.forecast || [];
  const history = dashboard?.history || [];
  const health = {
    ...(snapshot?.health || {}),
    ...(live.systemHealth || {}),
    totalRecords: dashboard?.history?.length || snapshot?.health?.totalRecords,
  };

  const safety = useMemo(
    () => getCampusSafetyStatus(current, aqi, snapshot?.settings?.thresholds),
    [current, aqi, snapshot?.settings?.thresholds]
  );

  const chartSeries = useMemo(() => buildWeatherChartSeries(history), [history]);
  const hourly = useMemo(() => buildHourlyForecast(forecast), [forecast]);
  const weekly = useMemo(() => buildWeeklyForecast(forecast), [forecast]);
  const guidance = useMemo(() => getRoleWeatherGuidance(current, aqi), [current, aqi]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !snapshot && !dashboard) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadWeather} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Weather Intelligence</p>
            <h1 className="text-3xl font-bold text-slate-900">Admin Weather Command Center</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live campus conditions, safety posture, alerts, and cross-module impact in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh weather
          </button>
        </div>

        <WeatherHeroCard weather={current} onRefresh={handleRefresh} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">School Safety Status</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${safety.badgeClass}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${safety.dotClass}`} />
                    {safety.label}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">{safety.summary}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
                <Shield className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {safety.issues.map((issue) => (
                <div key={issue} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {issue}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metricCards(current, aqi).map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className={`inline-flex rounded-xl p-2.5 ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <HourlyForecast hourly={hourly} />
              <WeeklyForecast weekly={weekly} />
            </div>
            {chartSeries.length ? <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><WeatherCharts chartData={chartSeries} /></div> : null}
          </div>
          <div className="space-y-6">
            <AQIWidget aqi={aqi} />
            <WeatherSystemHealth health={health} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Siren className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Weather Alerts Panel</h2>
            </div>
            <div className="space-y-3">
              {alerts.length ? (
                alerts.slice(0, 4).map((alert) => (
                  <div key={alert._id} className="rounded-2xl border border-slate-200 p-4">
                    <WeatherAlertCard alert={alert} />
                    <p className="mt-3 text-xs text-slate-500">Audience: {formatAlertAudience(alert)}</p>
                  </div>
                ))
              ) : (
                <WeatherEmptyState
                  message="No active weather alerts"
                  subtitle="Create heat, rain, fog, or AQI notices from the Alerts page."
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-900">Role Guidance</h2>
            </div>
            <div className="space-y-3">
              {guidance.map((item) => (
                <div key={item.role} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.role}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {snapshot?.analytics ? (
          <>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">Weather Impact Analytics</h2>
            </div>
            <WeatherImpactCharts analytics={snapshot.analytics} />
          </>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-semibold">Attendance vs Weather</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {snapshot?.analytics?.attendance?.insights?.attendanceDropOnRainyDays ?? 0}%
            </p>
            <p className="mt-2 text-sm text-slate-500">Average attendance drop on rainy days.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <Bus className="h-5 w-5" />
              <p className="text-sm font-semibold">Transport Weather</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {snapshot?.analytics?.transport?.totalHighRiskDays ?? 0}
            </p>
            <p className="mt-2 text-sm text-slate-500">High-risk route days detected in the selected analytics window.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-violet-600">
              <Droplets className="h-5 w-5" />
              <p className="text-sm font-semibold">Hostel Weather</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {snapshot?.analytics?.hostel?.insights?.avgComplaintsOnHighHumidityDays ?? 0}
            </p>
            <p className="mt-2 text-sm text-slate-500">Average hostel complaints on high-humidity days.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherOverviewPage;
