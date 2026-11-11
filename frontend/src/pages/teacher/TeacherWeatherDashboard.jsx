import { useState, useEffect } from 'react';
import { Cloud, BookOpen, Activity, Calendar, Thermometer, Sun, CloudRain, ClipboardList } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getTeacherWeatherSummary } from '../../services/weatherService';
import { formatTemp, getWeatherIcon, getAQIInfo } from '../../utils/weatherHelpers';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherRoleHeader from '../../components/weather/WeatherRoleHeader';

const TeacherWeatherDashboard = ({
  layoutRole = 'teacher',
  title = 'Teacher Weather Dashboard',
  subtitle = 'Plan your lessons with real-time weather insights',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getTeacherWeatherSummary();
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

  const { current, aqi, todayForecast = [], alerts = [], advice = [] } = data;
  const weatherIcon = current ? getWeatherIcon(current.condition) : null;

  const adviceCard = (item, idx) => (
    <div key={idx} className={`p-3 rounded-lg border ${
      item.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' :
      item.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
      'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      <p className="text-sm">{item.text}</p>
    </div>
  );

  return (
    <Layout role={layoutRole}>
    <div className="space-y-6">
      <WeatherRoleHeader role="teacher" title={title} subtitle={subtitle} />

      {/* Current Weather Summary */}
      {current && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{formatTemp(current.temperature)}</span>
                <span className="text-gray-400">Feels {formatTemp(current.feelsLike)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{weatherIcon?.icon}</span>
                <span className="text-gray-700 font-medium">{current.condition}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Humidity: {current.humidity}%</p>
              <p className="text-sm text-gray-500">Wind: {current.windSpeed} km/h</p>
              <p className="text-sm text-gray-500">Visibility: {current.visibility} km</p>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Advisory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outdoor Class Suitability */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Outdoor Class Suitability
          </h3>
          {current && (
            <div className="space-y-2">
              <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                current.temperature >= 38 ? 'bg-red-100 text-red-700' :
                current.temperature >= 35 ? 'bg-amber-100 text-amber-700' :
                current.temperature <= 5 ? 'bg-red-100 text-red-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {current.temperature >= 38 || current.temperature <= 5 ? 'Not Suitable ❌' :
                 current.temperature >= 35 ? 'Limited ⚠️' : 'Suitable ✅'}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {current.temperature >= 38 ? 'Extreme heat — outdoor classes not recommended.' :
                 current.temperature <= 5 ? 'Too cold — keep classes indoors.' :
                 current.temperature >= 35 ? 'Consider indoor alternatives for afternoon classes.' :
                 'Weather is suitable for outdoor classes.'}
              </p>
            </div>
          )}
        </div>

        {/* Sports Advice */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Sports Activity
          </h3>
          {current && (
            <div className="space-y-2">
              <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                current.temperature >= 38 || current.windSpeed > 35 ? 'bg-red-100 text-red-700' :
                current.temperature >= 35 || current.windSpeed > 25 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {current.temperature >= 38 || current.windSpeed > 35 ? 'Canceled ⛔' :
                 current.temperature >= 35 || current.windSpeed > 25 ? 'Not Recommended ⚠️' :
                 'Allowed ✅'}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {current.temperature >= 38 ? 'All outdoor sports canceled due to extreme heat.' :
                 current.windSpeed > 35 ? 'High winds — sports not safe.' :
                 current.temperature >= 35 ? 'Consider indoor sports alternatives.' :
                 'Sports activities can proceed as normal.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advice Section */}
      {advice.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {advice.map((item, idx) => adviceCard(item, idx))}
          </div>
        </div>
      )}

      {/* Forecast */}
      {todayForecast.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Next 12 Hours Forecast
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {todayForecast.map((hour, idx) => {
              const icon = getWeatherIcon(hour.condition);
              const time = new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
              return (
                <div key={idx} className="flex-shrink-0 w-20 p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-2">{time}</p>
                  <span className="text-lg">{icon?.icon}</span>
                  <p className="text-sm font-bold mt-1">{formatTemp(hour.temperature)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-amber-500" />
            Active Alerts
          </h3>
          {alerts.map((alert, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-2">
              <p className="text-sm font-medium text-amber-800">{alert.title}</p>
              <p className="text-xs text-amber-600">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default TeacherWeatherDashboard;
