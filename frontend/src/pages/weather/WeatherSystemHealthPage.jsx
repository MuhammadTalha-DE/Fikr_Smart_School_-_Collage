import { useCallback, useEffect, useState } from 'react';
import { Activity, Clock, Database, RefreshCw } from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherSystemHealth from '../../components/weather/WeatherSystemHealth';
import {
  forceWeatherSync,
  getWeatherActionLogs,
  getWeatherCronStatus,
  getWeatherSystemHealth,
} from '../../services/weatherService';

const WeatherSystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [cron, setCron] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      setError('');
      const [healthRes, cronRes, logsRes] = await Promise.all([
        getWeatherSystemHealth(),
        getWeatherCronStatus(),
        getWeatherActionLogs({ limit: 12 }),
      ]);
      setHealth(healthRes.data.data);
      setCron(cronRes.data.data);
      setLogs(logsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load system health data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      await forceWeatherSync();
    } catch (err) {
      setError(err.response?.data?.message || 'Force refresh failed.');
      setRefreshing(false);
      return;
    }
    loadHealth();
  };

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !health) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadHealth} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">System Health</p>
            <h1 className="text-3xl font-bold text-slate-900">Weather Platform Health</h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor scheduler status, data sync activity, and action logs across the weather subsystem.
            </p>
          </div>
          <button
            type="button"
            onClick={handleForceRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Force sync now
          </button>
        </div>

        <WeatherSystemHealth health={{ ...(health || {}), ...(cron || {}) }} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Activity className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Scheduler Running</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{cron?.isRunning ? 'Yes' : 'No'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Clock className="h-5 w-5 text-sky-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Last Refresh</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {cron?.lastRefreshTime ? new Date(cron.lastRefreshTime).toLocaleString() : 'Not yet'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Database className="h-5 w-5 text-violet-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Refresh Count</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{cron?.refreshCount ?? 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Weather Actions</h2>
          <div className="mt-4 space-y-3">
            {logs.length ? (
              logs.map((log) => (
                <div key={log._id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {log.performedBy?.name ? `Performed by ${log.performedBy.name}` : 'System generated action'}
                  </p>
                </div>
              ))
            ) : (
              <WeatherEmptyState message="No recent weather logs" />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherSystemHealthPage;
