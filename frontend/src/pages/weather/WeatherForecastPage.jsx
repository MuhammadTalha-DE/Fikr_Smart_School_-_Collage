import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CloudRain, SunMedium, Wind } from 'lucide-react';
import Layout from '../../components/common/Layout';
import HourlyForecast from '../../components/weather/HourlyForecast';
import WeatherCharts from '../../components/weather/WeatherCharts';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherHeroCard from '../../components/weather/WeatherHeroCard';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeeklyForecast from '../../components/weather/WeeklyForecast';
import {
  getCurrentWeather,
  getForecast,
  getHourlyForecast,
  getWeeklyForecast,
} from '../../services/weatherService';
import {
  buildHourlyForecast,
  buildWeeklyForecast,
  getWeatherHighlights,
} from './weatherPageHelpers';

const WeatherForecastPage = () => {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadForecast = useCallback(async () => {
    try {
      setError('');
      const [currentRes, forecastRes, hourlyRes, weeklyRes] = await Promise.all([
        getCurrentWeather(),
        getForecast(),
        getHourlyForecast(),
        getWeeklyForecast(),
      ]);

      setCurrent(currentRes.data.data);
      setForecast(forecastRes.data.data || []);
      setHourly(hourlyRes.data.data || []);
      setWeekly(weeklyRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load forecast data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const hourlyData = useMemo(
    () => (hourly.length ? hourly : buildHourlyForecast(forecast)),
    [hourly, forecast]
  );
  const weeklyData = useMemo(
    () => (weekly.length ? weekly : buildWeeklyForecast(forecast)),
    [weekly, forecast]
  );
  const chartData = useMemo(
    () =>
      forecast.slice(0, 12).map((item) => ({
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }),
        temperature: item.temperature,
        humidity: item.humidity,
        wind: item.windSpeed,
        aqi: 0,
      })),
    [forecast]
  );
  const highlights = useMemo(() => getWeatherHighlights(forecast), [forecast]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !forecast.length) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadForecast} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Forecast Center</p>
          <h1 className="text-3xl font-bold text-slate-900">24 Hour and 7 Day Outlook</h1>
          <p className="mt-1 text-sm text-slate-500">
            Plan classes, transport, hostel comfort, and parent notices around the next weather windows.
          </p>
        </div>

        <WeatherHeroCard weather={current} onRefresh={loadForecast} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <SunMedium className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Hottest Window</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {highlights.hottestWindow ? `${Math.round(highlights.hottestWindow.temperature)} C` : 'N/A'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {highlights.hottestWindow ? new Date(highlights.hottestWindow.time).toLocaleString() : 'No forecast window found.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CloudRain className="h-5 w-5 text-sky-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Wettest Window</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {highlights.wettestWindow ? `${Math.round(highlights.wettestWindow.rainfall || 0)} mm` : 'N/A'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {highlights.wettestWindow ? new Date(highlights.wettestWindow.time).toLocaleString() : 'No rain signal found.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Wind className="h-5 w-5 text-violet-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Calmest Travel Slot</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {highlights.calmestWindow ? `${Math.round(highlights.calmestWindow.windSpeed || 0)} km/h` : 'N/A'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {highlights.calmestWindow ? new Date(highlights.calmestWindow.time).toLocaleString() : 'No calm window found.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <HourlyForecast hourly={hourlyData} />
          <WeeklyForecast weekly={weeklyData} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Forecast Trendlines</h2>
          </div>
          {chartData.length ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <WeatherCharts chartData={chartData} />
            </div>
          ) : (
            <WeatherEmptyState message="No forecast chart data available" />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WeatherForecastPage;
