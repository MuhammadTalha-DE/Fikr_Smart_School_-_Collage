import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gauge, Shield, Wind } from 'lucide-react';
import Layout from '../../components/common/Layout';
import AQIWidget from '../../components/weather/AQIWidget';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import { getAQI, getCurrentWeather } from '../../services/weatherService';
import { getAQIInfo } from '../../utils/weatherHelpers';

const pollutantCards = (aqi) => [
  { label: 'PM2.5', value: aqi?.pm25, unit: 'ug/m3' },
  { label: 'PM10', value: aqi?.pm10, unit: 'ug/m3' },
  { label: 'Ozone', value: aqi?.o3, unit: 'ug/m3' },
  { label: 'NO2', value: aqi?.no2, unit: 'ug/m3' },
  { label: 'SO2', value: aqi?.so2, unit: 'ug/m3' },
  { label: 'CO', value: aqi?.co, unit: 'ug/m3' },
];

const WeatherAQIPage = () => {
  const [aqi, setAqi] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAQI = useCallback(async () => {
    try {
      setError('');
      const [aqiRes, currentRes] = await Promise.all([getAQI(), getCurrentWeather()]);
      setAqi(aqiRes.data.data);
      setCurrent(currentRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load AQI data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAQI();
  }, [loadAQI]);

  const info = useMemo(() => (aqi ? getAQIInfo(aqi.aqi) : null), [aqi]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !aqi) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadAQI} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">AQI Monitoring</p>
          <h1 className="text-3xl font-bold text-slate-900">Campus Air Quality Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track pollutant load, health impact, and outdoor exposure readiness for the full campus.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <AQIWidget aqi={aqi} />

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Health Guidance</h2>
            </div>
            <div className={`mt-4 rounded-2xl border p-4 ${info?.bg} ${info?.border}`}>
              <p className={`text-lg font-bold ${info?.color}`}>{info?.label || 'Unknown'}</p>
              <p className="mt-2 text-sm text-slate-700">
                {aqi?.aqi >= 4
                  ? 'Sensitive groups should stay indoors, physical exertion should be limited, and parent notices should be considered.'
                  : aqi?.aqi === 3
                    ? 'Outdoor activity can continue with moderation and hydration reminders.'
                    : 'Air quality is favorable for routine classes, sports, and transport operations.'}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Outdoor Classes</p>
                <p className="mt-2 text-sm text-slate-600">
                  {aqi?.aqi >= 4 ? 'Move activity indoors.' : 'Proceed with normal supervision.'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Sports and PE</p>
                <p className="mt-2 text-sm text-slate-600">
                  {aqi?.aqi >= 4 ? 'Suspend strenuous sessions.' : aqi?.aqi === 3 ? 'Limit high-intensity drills.' : 'Suitable for normal sessions.'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Hostel Ventilation</p>
                <p className="mt-2 text-sm text-slate-600">
                  {(current?.humidity || 0) > 80 ? 'Watch room moisture and airflow this evening.' : 'Comfort conditions remain manageable.'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Transport Exposure</p>
                <p className="mt-2 text-sm text-slate-600">
                  {(current?.windSpeed || 0) > 20 ? 'Drivers should keep windows controlled during dusty stretches.' : 'Normal travel exposure profile.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">Pollutant Breakdown</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {pollutantCards(aqi).map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value != null ? Number(item.value).toFixed(1) : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900">Operational Response Notes</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Students with respiratory sensitivity should be prioritized in high-AQI notifications.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Parents can be included in preventive alerts whenever AQI shifts into poor or very poor ranges.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Admin teams should align sports, assembly, and transport announcements with AQI spikes.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherAQIPage;
