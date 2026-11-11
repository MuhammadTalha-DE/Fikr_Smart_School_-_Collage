import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bus,
  Eye,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherAlertCard from '../../components/weather/WeatherAlertCard';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherHeroCard from '../../components/weather/WeatherHeroCard';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import useWeatherSocket from '../../hooks/useWeatherSocket';
import { getAQI, getCurrentWeather, getWeatherAlerts } from '../../services/weatherService';
import { getCampusSafetyStatus } from './weatherPageHelpers';

const WeatherLiveCenterPage = () => {
  const [current, setCurrent] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const live = useWeatherSocket({ enabled: true });

  const loadLive = useCallback(async () => {
    try {
      setError('');
      const [currentRes, aqiRes, alertsRes] = await Promise.all([
        getCurrentWeather(),
        getAQI(),
        getWeatherAlerts(),
      ]);

      setCurrent(currentRes.data.data);
      setAqi(aqiRes.data.data);
      setAlerts(alertsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load live weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLive();
  }, [loadLive]);

  const activeCurrent = live.liveWeather || current;
  const activeAqi = live.liveAQI || aqi;
  const safety = useMemo(() => getCampusSafetyStatus(activeCurrent, activeAqi), [activeCurrent, activeAqi]);

  const metrics = [
    { label: 'Feels Like', value: `${Math.round(activeCurrent?.feelsLike ?? 0)} C`, icon: Thermometer },
    { label: 'Visibility', value: `${Math.round(activeCurrent?.visibility ?? 0)} km`, icon: Eye },
    { label: 'Wind Speed', value: `${Math.round(activeCurrent?.windSpeed ?? 0)} km/h`, icon: Wind },
    { label: 'Pressure', value: `${Math.round(activeCurrent?.pressure ?? 0)} hPa`, icon: Waves },
    { label: 'AQI', value: activeAqi?.aqi ?? 'N/A', icon: Gauge },
    { label: 'Cloud Cover', value: `${Math.round(activeCurrent?.cloudCoverage ?? 0)}%`, icon: Activity },
  ];

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !activeCurrent) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadLive} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Live Weather Center</p>
            <h1 className="text-3xl font-bold text-slate-900">Real-time Campus Weather Feed</h1>
            <p className="mt-1 text-sm text-slate-500">
              Watch live weather, AQI, transport signals, hostel environment alerts, and push updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${live.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${live.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {live.connected ? 'Socket live' : 'Polling fallback'}
            </span>
            <button
              type="button"
              onClick={loadLive}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Sync now
            </button>
          </div>
        </div>

        <WeatherHeroCard weather={activeCurrent} onRefresh={loadLive} />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="inline-flex rounded-xl bg-slate-50 p-2.5 text-slate-700">
                <metric.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">School Safety Signal</h2>
            </div>
            <span className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${safety.badgeClass}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${safety.dotClass}`} />
              {safety.label}
            </span>
            <p className="mt-3 text-sm text-slate-600">{safety.summary}</p>
            <div className="mt-4 space-y-2">
              {safety.issues.map((issue) => (
                <div key={issue} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {issue}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold text-slate-900">Transport Weather</h2>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {live.transportRisk?.message || 'No live route risk event received yet.'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {live.transportRisk ? `Risk level: ${live.transportRisk.risk}` : 'Route risk will stream here after the next scheduler cycle.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-slate-900">Hostel Environment</h2>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {live.hostelAlert?.message || 'No live hostel alert received yet.'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {live.hostelAlert ? `Status: ${live.hostelAlert.status}` : 'Humidity and comfort alerts will appear here in real time.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Active Weather Alerts</h2>
              <p className="text-sm text-slate-500">Latest notices for school, parents, teachers, hostel, and transport teams.</p>
            </div>
            {live.lastUpdate ? (
              <p className="text-xs font-medium text-slate-400">Last event {live.lastUpdate.toLocaleTimeString()}</p>
            ) : null}
          </div>
          <div className="space-y-3">
            {alerts.length ? (
              alerts.map((alert) => <WeatherAlertCard key={alert._id} alert={alert} />)
            ) : (
              <WeatherEmptyState message="No active live alerts" subtitle="New notices will appear here when admins create or automate them." />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherLiveCenterPage;
