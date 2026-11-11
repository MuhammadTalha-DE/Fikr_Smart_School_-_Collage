import { useState, useEffect } from 'react';
import { Cloud, Shield, Bus, Eye, Wind, Umbrella, Thermometer, AlertTriangle } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getParentWeatherSummary } from '../../services/weatherService';
import { formatTemp, getWeatherIcon, getAQIInfo } from '../../utils/weatherHelpers';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherRoleHeader from '../../components/weather/WeatherRoleHeader';

const ParentWeatherDashboard = ({
  layoutRole = 'parent',
  title = 'Parent Weather Dashboard',
  subtitle = 'Keep your child safe with real-time weather updates',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getParentWeatherSummary();
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

  const { current, aqi, alerts = [], advice = [], childSafetyAdvice = [], transportStatus } = data;

  const safetyAdvice = advice.length > 0 ? advice : childSafetyAdvice;
  const weatherIcon = current ? getWeatherIcon(current.condition) : null;
  const aqiInfo = aqi ? getAQIInfo(aqi.aqi) : null;

  return (
    <Layout role={layoutRole}>
    <div className="space-y-6">
      <WeatherRoleHeader role="parent" title={title} subtitle={subtitle} />

      {/* Current Weather */}
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
            <div className="flex items-center gap-2">
              {aqi && (
                <div className={`px-3 py-2 rounded-lg text-center ${aqiInfo?.bg}`}>
                  <p className={`text-sm font-bold ${aqiInfo?.color}`}>AQI {aqi.aqi}</p>
                  <p className={`text-xs ${aqiInfo?.color}`}>{aqiInfo?.label}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-2 rounded-lg bg-purple-50">
              <Thermometer className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Humidity</p>
              <p className="text-sm font-bold">{current.humidity}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-sky-50">
              <Wind className="w-4 h-4 text-sky-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Wind</p>
              <p className="text-sm font-bold">{current.windSpeed} km/h</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <Eye className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Visibility</p>
              <p className="text-sm font-bold">{current.visibility} km</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-50">
              <Umbrella className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Rain</p>
              <p className="text-sm font-bold">{current.rainfall || 0} mm</p>
            </div>
          </div>
        </div>
      )}

      {/* Transport Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-500" />
          School Transport Status
        </h3>
        {transportStatus ? (
          <div className={`p-3 rounded-lg border ${
            transportStatus.status === 'delayed' ? 'bg-red-50 border-red-200' :
            transportStatus.status === 'caution' ? 'bg-amber-50 border-amber-200' :
            'bg-emerald-50 border-emerald-200'
          }`}>
            <p className="text-sm font-medium">{transportStatus.message}</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-700">🚌 Transport is operating normally.</p>
          </div>
        )}
      </div>

      {/* Child Safety Advice */}
      {safetyAdvice.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Child Safety Advice
          </h3>
          <div className="space-y-2">
            {safetyAdvice.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${
                item.type === 'danger' ? 'bg-red-50 border-red-200' :
                item.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
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

export default ParentWeatherDashboard;
