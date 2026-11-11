import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Bus, CloudRain, Droplets } from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherImpactCharts from '../../components/weather/WeatherImpactCharts';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import { getWeatherImpactAnalytics } from '../../services/weatherService';

const WeatherImpactAnalysisPage = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const res = await getWeatherImpactAnalytics({ days });
      setAnalytics(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load weather impact analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !analytics) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadAnalytics} />
      </Layout>
    );
  }

  const attendanceDrop = analytics?.attendance?.insights?.attendanceDropOnRainyDays ?? 0;
  const highRiskDays = analytics?.transport?.totalHighRiskDays ?? 0;
  const humidityComplaints = analytics?.hostel?.insights?.avgComplaintsOnHighHumidityDays ?? 0;

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Impact Analysis</p>
            <h1 className="text-3xl font-bold text-slate-900">Weather vs School Operations</h1>
            <p className="mt-1 text-sm text-slate-500">
              Understand how weather conditions affect attendance, transport stability, and hostel operations.
            </p>
          </div>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 lg:w-auto"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CloudRain className="h-5 w-5 text-rose-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Attendance Drop on Rainy Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{attendanceDrop}%</p>
            <p className="mt-2 text-sm text-slate-500">Compared with routine school days in the selected period.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Bus className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">High-risk Transport Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{highRiskDays}</p>
            <p className="mt-2 text-sm text-slate-500">Days where route delays or safety warnings were likely.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Droplets className="h-5 w-5 text-violet-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Complaints on Humid Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{humidityComplaints}</p>
            <p className="mt-2 text-sm text-slate-500">Average hostel complaints when humidity stays elevated.</p>
          </div>
        </div>

        <WeatherImpactCharts analytics={analytics} />

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Decision Notes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Use rainy-day attendance loss to trigger early parent notices, remote-work contingencies, or staggered arrival plans.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              High transport risk clusters are useful for driver advisories, route resequencing, and delay communication workflows.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Hostel humidity trends help prioritize ventilation checks and room-comfort inspections on sensitive days.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherImpactAnalysisPage;
