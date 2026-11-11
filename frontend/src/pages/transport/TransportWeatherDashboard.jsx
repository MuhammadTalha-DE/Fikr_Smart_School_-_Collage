import { useState, useEffect } from 'react';
import { Cloud, Bus, Eye, Wind, CloudRain, CloudFog, AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getTransportWeatherSummary } from '../../services/weatherService';
import { formatTemp, getWeatherIcon } from '../../utils/weatherHelpers';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherRoleHeader from '../../components/weather/WeatherRoleHeader';

const TransportWeatherDashboard = ({
  layoutRole = 'admin',
  title = 'Transport Weather Dashboard',
  subtitle = 'Real-time route safety and driver advisories',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getTransportWeatherSummary();
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

  const { current, alerts = [], routeRisk, driverAdvisory = [], parentDelayInfo, routeSafetyStatus } = data;

  const weatherIcon = current ? getWeatherIcon(current.condition) : null;

  const riskColors = {
    high: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    medium: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    low: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  };

  return (
    <Layout role={layoutRole}>
    <div className="space-y-6">
      <WeatherRoleHeader role="transport" title={title} subtitle={subtitle} />

      {/* Current Weather */}
      {current && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{formatTemp(current.temperature)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{weatherIcon?.icon}</span>
                <span className="text-gray-700 font-medium">{current.condition}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-sky-50 rounded-lg">
                <Wind className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Wind</p>
                <p className="text-sm font-bold">{current.windSpeed} km/h</p>
              </div>
              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                <Eye className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Visibility</p>
                <p className="text-sm font-bold">{current.visibility} km</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Risk Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Route Risk Assessment
          </h3>
          {routeRisk ? (
            <div className={`p-4 rounded-xl border ${riskColors[routeRisk.risk]?.bg || riskColors.low.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${riskColors[routeRisk.risk]?.badge || riskColors.low.badge}`}>
                  {routeRisk.risk?.toUpperCase() || 'LOW'}
                </span>
              </div>
              <p className={`text-sm ${riskColors[routeRisk.risk]?.text || riskColors.low.text}`}>
                {routeRisk.message}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">✅ Low risk — Normal driving conditions.</p>
            </div>
          )}
        </div>

        {/* Route Safety Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-500" />
            Route Safety Status
          </h3>
          {routeSafetyStatus ? (
            <div className={`p-4 rounded-xl border ${
              routeSafetyStatus.status === 'unsafe' ? 'bg-red-50 border-red-200' :
              routeSafetyStatus.status === 'caution' ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <p className={`text-sm font-medium ${
                routeSafetyStatus.status === 'unsafe' ? 'text-red-700' :
                routeSafetyStatus.status === 'caution' ? 'text-amber-700' :
                'text-emerald-700'
              }`}>
                {routeSafetyStatus.message}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">All routes clear and safe.</p>
            </div>
          )}
        </div>
      </div>

      {/* Parent Delay Info */}
      {parentDelayInfo?.shouldNotify && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-500" />
            Parent Delay Notification
          </h3>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-700">
              ⚠️ Notify parents: Estimated delay of {parentDelayInfo.estimatedDelay} due to {parentDelayInfo.reason}
            </p>
          </div>
        </div>
      )}

      {/* Driver Advisory */}
      {driverAdvisory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Driver Advisory
          </h3>
          <div className="space-y-2">
            {driverAdvisory.map((advice, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Conditions Impact */}
      {current && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-gray-500" />
            Current Weather Impact
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 text-center">
              <Eye className={`w-6 h-6 mx-auto mb-2 ${current.visibility >= 5 ? 'text-emerald-500' : current.visibility >= 3 ? 'text-amber-500' : 'text-red-500'}`} />
              <p className="text-xs text-gray-500">Visibility</p>
              <p className="text-lg font-bold">{current.visibility} km</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 text-center">
              <Wind className={`w-6 h-6 mx-auto mb-2 ${current.windSpeed <= 15 ? 'text-emerald-500' : current.windSpeed <= 25 ? 'text-amber-500' : 'text-red-500'}`} />
              <p className="text-xs text-gray-500">Wind Speed</p>
              <p className="text-lg font-bold">{current.windSpeed} km/h</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 text-center">
              <CloudRain className={`w-6 h-6 mx-auto mb-2 ${(current.rainfall || 0) <= 2 ? 'text-emerald-500' : (current.rainfall || 0) <= 10 ? 'text-amber-500' : 'text-red-500'}`} />
              <p className="text-xs text-gray-500">Rainfall</p>
              <p className="text-lg font-bold">{current.rainfall || 0} mm</p>
            </div>
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

export default TransportWeatherDashboard;
