import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  AlertTriangle,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { getCurrentWeather, getAQI, getWeatherAlerts } from '../../services/weatherService';
import { getWeatherIcon, getAQIInfo, isRainy, isFoggy, formatTemp } from '../../utils/weatherHelpers';

const WeatherMiniWidget = ({ role = 'admin', compact = false }) => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherRes, aqiRes, alertsRes] = await Promise.allSettled([
          getCurrentWeather(),
          getAQI(),
          getWeatherAlerts(),
        ]);

        if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data.data);
        if (aqiRes.status === 'fulfilled') setAqi(aqiRes.value.data.data);
        if (alertsRes.status === 'fulfilled') {
          const alertData = alertsRes.value.data.data || [];
          setAlerts(alertData.slice(0, 2));
        }
        setError(null);
      } catch (err) {
        setError('Weather unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dashboardLinkMap = {
    admin: '/admin/weather',
    student: '/student/weather',
    teacher: '/teacher/weather',
    parent: '/parent/weather-safety',
    warden: '/warden/hostel-weather',
    librarian: '/librarian/weather',
    transport: '/transport/weather',
  };
  const dashboardLink = dashboardLinkMap[role] || '/admin/weather';

  const weatherInfo = weather ? getWeatherIcon(weather.condition || 'Clear') : null;
  const aqiInfo = aqi ? getAQIInfo(aqi.aqi) : null;
  const hasAlerts = alerts.length > 0;
  const activeAlertCount = alerts.filter((alert) => alert.isActive !== false).length;
  const statusLabel = weather?.isFallback ? 'Cached weather' : 'Live weather';

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Weather Unavailable</p>
              <p className="text-xs text-gray-400">Click to retry</p>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-xs text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => navigate(dashboardLink)}
        className="w-full bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${weatherInfo?.color}`}>{weatherInfo?.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{formatTemp(weather.temperature)}</span>
                <span className="text-sm text-gray-500">{weather.condition}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className={`text-xs font-medium ${weather?.isFallback ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {statusLabel}
                </span>
                {aqi && (
                  <span className={`text-xs font-medium ${aqiInfo?.color}`}>
                    AQI: {aqi.aqi}
                  </span>
                )}
                {hasAlerts && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    {activeAlertCount} alert{activeAlertCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(dashboardLink)}
      className="w-full bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-4xl ${weatherInfo?.color}`}>{weatherInfo?.icon}</div>
          <div>
            <p className="text-sm text-gray-500">{weather.locationName || 'Current Location'}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{formatTemp(weather.temperature)}</span>
              <span className="text-sm text-gray-500">Feels {formatTemp(weather.feelsLike)}</span>
            </div>
            <p className="text-sm font-medium text-gray-700">{weather.condition} - {weather.description}</p>
            <p className={`mt-1 text-xs ${weather?.isFallback ? 'text-amber-600' : 'text-emerald-600'}`}>
              {weather.source || statusLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">Details</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
          <Thermometer className="w-4 h-4 text-red-400 mb-1" />
          <span className="text-xs text-gray-500">Humidity</span>
          <span className="text-sm font-semibold">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
          <Wind className="w-4 h-4 text-sky-400 mb-1" />
          <span className="text-xs text-gray-500">Wind</span>
          <span className="text-sm font-semibold">{weather.windSpeed} km/h</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
          <Eye className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-xs text-gray-500">Vis.</span>
          <span className="text-sm font-semibold">{weather.visibility} km</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
          <Droplets className="w-4 h-4 text-blue-400 mb-1" />
          <span className="text-xs text-gray-500">Rain</span>
          <span className="text-sm font-semibold">{weather.rainfall || 0} mm</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {aqi && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${aqiInfo?.bg} ${aqiInfo?.color}`}>
            <Gauge className="w-3 h-3" />
            AQI: {aqi.aqi} - {aqiInfo?.label}
          </span>
        )}
        {hasAlerts && alerts.slice(0, 1).map((alert, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
            <AlertTriangle className="w-3 h-3" />
            {alert.title || alert.message?.slice(0, 30)}
          </span>
        ))}
        {isRainy(weather.condition) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
            <CloudRain className="w-3 h-3" />
            Rain expected
          </span>
        )}
        {isFoggy(weather.condition, weather.visibility) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
            <Cloud className="w-3 h-3" />
            Low visibility
          </span>
        )}
      </div>
    </button>
  );
};

export default WeatherMiniWidget;
