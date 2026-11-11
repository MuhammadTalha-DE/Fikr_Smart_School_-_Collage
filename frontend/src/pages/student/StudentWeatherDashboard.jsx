import { useState, useEffect } from 'react';
import { Cloud, Sun, Thermometer, CloudRain, CloudFog, Shield, Umbrella, Eye, Wind } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getStudentWeatherSummary } from '../../services/weatherService';
import { formatTemp, getWeatherIcon, getAQIInfo } from '../../utils/weatherHelpers';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';

const StudentWeatherDashboard = ({
  layoutRole = 'student',
  title = 'Student Weather Center',
  subtitle = 'Stay safe and plan your day',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getStudentWeatherSummary();
        setData(res.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4">
      <WeatherSkeleton />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <WeatherEmptyState message={error} />
    </div>
  );

  if (!data) return (
    <div className="p-6">
      <WeatherEmptyState message="No weather data available" />
    </div>
  );

  const { current, aqi, alerts = [], advice = [] } = data;

  const weatherIcon = current ? getWeatherIcon(current.condition) : null;
  const aqiInfo = aqi ? getAQIInfo(aqi.aqi) : null;

  return (
    <Layout role={layoutRole}>
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-6 h-6 text-blue-200" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <p className="text-blue-100 text-sm">{subtitle}</p>
      </div>

      {/* Current Weather Card */}
      {current && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{current.locationName || 'Campus'}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold text-gray-900">{formatTemp(current.temperature)}</span>
                <span className="text-gray-400">Feels {formatTemp(current.feelsLike)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{weatherIcon?.icon}</span>
                <span className="text-gray-700 font-medium">{current.condition}</span>
                <span className="text-gray-400 text-sm capitalize">— {current.description}</span>
              </div>
            </div>
            <div className="text-6xl">{weatherIcon?.icon}</div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Thermometer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Humidity</p>
              <p className="text-sm font-bold">{current.humidity}%</p>
            </div>
            <div className="text-center p-3 bg-sky-50 rounded-xl">
              <Wind className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Wind</p>
              <p className="text-sm font-bold">{current.windSpeed} km/h</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <Eye className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Visibility</p>
              <p className="text-sm font-bold">{current.visibility} km</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <Umbrella className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Rain</p>
              <p className="text-sm font-bold">{current.rainfall || 0} mm</p>
            </div>
          </div>

          {/* AQI */}
          {aqi && (
            <div className={`mt-4 p-3 rounded-xl ${aqiInfo?.bg} border ${aqiInfo?.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Air Quality Index</span>
                <span className={`text-sm font-bold ${aqiInfo?.color}`}>
                  {aqi.aqi} — {aqiInfo?.label}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Advice */}
      {advice.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Today's Safety Advice
          </h3>
          <div className="space-y-3">
            {advice.map((item, idx) => {
              const typeColors = {
                danger: 'bg-red-50 border-red-200 text-red-700',
                warning: 'bg-amber-50 border-amber-200 text-amber-700',
                info: 'bg-blue-50 border-blue-200 text-blue-700',
                success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
              };
              return (
                <div key={idx} className={`p-3 rounded-lg border ${typeColors[item.type] || 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-amber-500" />
            Active Weather Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{alert.title}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outdoor Activity Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          Outdoor Activity
        </h3>
        <div className="flex items-center gap-3">
          {current && current.temperature >= 38 ? (
            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">Not Recommended 🔴</span>
          ) : current && current.temperature >= 35 ? (
            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">Caution 🟡</span>
          ) : (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">Safe 🟢</span>
          )}
          <p className="text-sm text-gray-500">
            {current?.temperature >= 38
              ? 'Extreme heat — stay indoors and stay hydrated.'
              : current?.temperature >= 35
              ? 'Hot day — limit outdoor activities.'
              : 'Weather is suitable for outdoor activities.'}
          </p>
        </div>
      </div>
    </div>
    </Layout>
  );
};

// Local AlertTriangle icon
const AlertTriangle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

export default StudentWeatherDashboard;
