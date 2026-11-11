import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CloudRain, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import { getWeatherAttendanceCorrelation } from '../../services/weatherService';

const WeatherAttendanceImpactPage = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAttendanceImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getWeatherAttendanceCorrelation({ days });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attendance correlation data.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadAttendanceImpact();
  }, [loadAttendanceImpact]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !data) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadAttendanceImpact} />
      </Layout>
    );
  }

  const insights = data?.insights || {};

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Attendance vs Weather</p>
            <h1 className="text-3xl font-bold text-slate-900">Weather Attendance Correlation</h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare attendance performance with temperature, rainfall, and weather condition shifts.
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Users className="h-5 w-5 text-sky-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Overall Average</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{insights.overallAverageAttendance ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CloudRain className="h-5 w-5 text-rose-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Rainy-day Average</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{insights.averageAttendanceOnRainyDays ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Users className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Normal-day Average</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{insights.averageAttendanceOnNormalDays ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CloudRain className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Drop on Rainy Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{insights.attendanceDropOnRainyDays ?? 0}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Correlation Timeline</h2>
          <p className="mt-1 text-sm text-slate-500">Attendance rate bars are paired with average temperature line movement.</p>
          {data?.correlation?.length ? (
            <div className="mt-6 h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.correlation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis yAxisId="left" stroke="#f97316" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="attendanceRate" fill="#f97316" radius={[6, 6, 0, 0]} name="Attendance Rate" />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Temperature" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6">
              <WeatherEmptyState message="No attendance correlation records yet" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WeatherAttendanceImpactPage;
