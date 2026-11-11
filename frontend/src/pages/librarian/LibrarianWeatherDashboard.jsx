import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Cloud, Droplets, Thermometer, Wind } from 'lucide-react';
import Layout from '../../components/common/Layout';
import AQIWidget from '../../components/weather/AQIWidget';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherRoleHeader from '../../components/weather/WeatherRoleHeader';
import { getAQI, getCurrentWeather, getWeatherAlerts } from '../../services/weatherService';
import { formatTemp, getWeatherIcon } from '../../utils/weatherHelpers';

const LibrarianWeatherDashboard = () => {
  const [current, setCurrent] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWeather = useCallback(async () => {
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
      setError(err.response?.data?.message || 'Unable to load library weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  if (loading) {
    return (
      <Layout role="librarian">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !current) {
    return (
      <Layout role="librarian">
        <WeatherEmptyState message={error} onRetry={loadWeather} />
      </Layout>
    );
  }

  const weatherIcon = current ? getWeatherIcon(current.condition) : null;

  return (
    <Layout role="librarian">
      <div className="space-y-6">
        <WeatherRoleHeader
          role="admin"
          title="Library Weather Dashboard"
          subtitle="Indoor comfort, humidity awareness, and library operations weather context"
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Campus Conditions</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-5xl font-bold text-slate-900">{formatTemp(current?.temperature ?? 0)}</span>
                  <span className="text-slate-500">Feels {formatTemp(current?.feelsLike ?? 0)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-slate-700">
                  <span className="text-2xl">{weatherIcon?.icon}</span>
                  <span className="font-medium">{current?.condition}</span>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-4xl">{weatherIcon?.icon}</div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <Droplets className="h-5 w-5 text-cyan-600" />
                <p className="mt-2 text-xs text-slate-500">Humidity</p>
                <p className="text-lg font-bold text-slate-900">{current?.humidity}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <Wind className="h-5 w-5 text-sky-600" />
                <p className="mt-2 text-xs text-slate-500">Wind</p>
                <p className="text-lg font-bold text-slate-900">{current?.windSpeed} km/h</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <Thermometer className="h-5 w-5 text-rose-600" />
                <p className="mt-2 text-xs text-slate-500">Visibility</p>
                <p className="text-lg font-bold text-slate-900">{current?.visibility} km</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <Cloud className="h-5 w-5 text-violet-600" />
                <p className="mt-2 text-xs text-slate-500">Cloud Cover</p>
                <p className="text-lg font-bold text-slate-900">{current?.cloudCoverage}%</p>
              </div>
            </div>
          </div>

          <AQIWidget aqi={aqi} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <BookOpen className="mb-3 h-5 w-5 text-indigo-600" />
            High humidity days are worth monitoring closely for reading-room comfort and archive preservation.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Low visibility or storms often shift student traffic indoors, which can increase library footfall and seating demand.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Current alerts: {alerts.length ? `${alerts.length} active weather notices are relevant to campus operations.` : 'No active weather notices right now.'}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LibrarianWeatherDashboard;
