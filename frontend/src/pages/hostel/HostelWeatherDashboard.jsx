import { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, Moon, Shield, AlertTriangle, Eye } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getHostelWeatherSummary } from '../../services/weatherService';
import { formatTemp, getWeatherIcon, getAQIInfo } from '../../utils/weatherHelpers';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherRoleHeader from '../../components/weather/WeatherRoleHeader';

const HostelWeatherDashboard = ({
  layoutRole = 'warden',
  title = 'Hostel Weather Dashboard',
  subtitle = 'Monitor hostel environment and student safety',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getHostelWeatherSummary();
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

  const { current, aqi, alerts = [], environmentStatus, healthAdvice = [], nightSafety } = data;

  const weatherIcon = current ? getWeatherIcon(current.condition) : null;
  const aqiInfo = aqi ? getAQIInfo(aqi.aqi) : null;

  return (
    <Layout role={layoutRole}>
    <div className="space-y-6">
      <WeatherRoleHeader role="hostel" title={title} subtitle={subtitle} />

      {/* Current Weather */}
      {current && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Conditions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{formatTemp(current.temperature)}</span>
                <span className="text-gray-400">Feels {formatTemp(current.feelsLike)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{weatherIcon?.icon}</span>
                <span className="text-gray-700 font-medium">{current.condition}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-600"><Droplets className="w-4 h-4 inline mr-1 text-cyan-500" />Humidity: {current.humidity}%</p>
              <p className="text-sm text-gray-600"><Wind className="w-4 h-4 inline mr-1 text-sky-500" />Wind: {current.windSpeed} km/h</p>
              <p className="text-sm text-gray-600"><Eye className="w-4 h-4 inline mr-1 text-emerald-500" />Visibility: {current.visibility} km</p>
            </div>
          </div>
        </div>
      )}

      {/* Environment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Environment Status
          </h3>
          {environmentStatus ? (
            <div className={`p-4 rounded-xl border ${
              environmentStatus.status === 'critical' ? 'bg-red-50 border-red-200' :
              environmentStatus.status === 'warning' ? 'bg-amber-50 border-amber-200' :
              environmentStatus.status === 'monitor' ? 'bg-blue-50 border-blue-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <p className={`text-sm font-medium ${
                environmentStatus.status === 'critical' ? 'text-red-700' :
                environmentStatus.status === 'warning' ? 'text-amber-700' :
                environmentStatus.status === 'monitor' ? 'text-blue-700' :
                'text-emerald-700'
              }`}>
                {environmentStatus.message}
              </p>
            </div>
          ) : current && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className={`font-bold ${current.temperature >= 38 ? 'text-red-600' : current.temperature <= 10 ? 'text-blue-600' : 'text-gray-900'}`}>
                  {formatTemp(current.temperature)}
                  {current.temperature >= 38 && ' 🔥'}
                  {current.temperature <= 5 && ' ❄️'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Humidity</span>
                <span className={`font-bold ${current.humidity > 80 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {current.humidity}%
                  {current.humidity > 80 && ' 💧'}
                </span>
              </div>
              {aqi && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">AQI Level</span>
                  <span className={`font-bold ${aqiInfo?.color}`}>{aqi.aqi} — {aqiInfo?.label}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Night Safety */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            Night Safety Status
          </h3>
          {nightSafety ? (
            <div className={`p-4 rounded-xl border ${
              nightSafety.alert ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className={`text-sm font-medium ${nightSafety.alert ? 'text-amber-700' : 'text-emerald-700'}`}>
                {nightSafety.message}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">Safe night conditions. No special precautions needed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Advice */}
      {healthAdvice.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-rose-500" />
            Health Advisory
          </h3>
          <div className="space-y-2">
            {healthAdvice.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">{item}</p>
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

export default HostelWeatherDashboard;
