import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, CloudRain, Bus, Building2, Lightbulb, Calendar } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getWeatherAnalytics, getWeatherImpactAnalytics } from '../../services/weatherService';
import WeatherCharts from '../../components/weather/WeatherCharts';
import WeatherImpactCharts from '../../components/weather/WeatherImpactCharts';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';

const WeatherAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [activeTab, setActiveTab] = useState('trends');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, impactRes] = await Promise.allSettled([
          getWeatherAnalytics({ days }),
          getWeatherImpactAnalytics({ days }),
        ]);

        if (analyticsRes.status === 'fulfilled') setAnalyticsData(analyticsRes.value.data.data);
        if (impactRes.status === 'fulfilled') setImpactData(impactRes.value.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading) return (
    <Layout role="admin"><div className="p-6">
      <WeatherSkeleton />
    </div></Layout>
  );

  if (error) return (
    <Layout role="admin"><div className="p-6">
      <WeatherEmptyState message={error} onRetry={() => window.location.reload()} />
    </div></Layout>
  );

  const tabs = [
    { id: 'trends', label: 'Weather Trends', icon: BarChart2 },
    { id: 'impact', label: 'Impact Analytics', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: Lightbulb },
  ];

  return (
    <Layout role="admin">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weather Analytics</h1>
            <p className="text-sm text-gray-500">Data-driven weather insights and correlations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.averageTemp}°C</p>
            <p className="text-xs text-gray-500">Avg Temperature</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.averageHumidity}%</p>
            <p className="text-xs text-gray-500">Avg Humidity</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.averageWindSpeed} km/h</p>
            <p className="text-xs text-gray-500">Avg Wind Speed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.rainyDays}</p>
            <p className="text-xs text-gray-500">Rainy Days</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsData?.history ? (
            <WeatherCharts chartData={analyticsData.history.map(h => ({
              time: new Date(h.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }),
              temperature: h.temperature,
              humidity: h.humidity,
              wind: h.windSpeed,
              aqi: h.aqi || 0,
            }))} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center col-span-2">
              <BarChart2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No historical data available for charting</p>
              <p className="text-xs text-gray-400 mt-1">Data will appear as weather history grows</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'impact' && (
        <WeatherImpactCharts analytics={impactData} />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {impactData?.insights?.length > 0 ? impactData.insights.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${
              insight.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 mt-0.5 ${insight.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{insight.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Metric: {insight.metric}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Lightbulb className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No AI insights available yet</p>
              <p className="text-xs text-gray-400 mt-1">Insights will generate as more weather data is collected</p>
            </div>
          )}

          {/* Analytics Summary */}
          {analyticsData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistical Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Max Temp</p>
                  <p className="text-lg font-bold text-red-600">{analyticsData.maxTemp}°C</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Min Temp</p>
                  <p className="text-lg font-bold text-blue-600">{analyticsData.minTemp}°C</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Records</p>
                  <p className="text-lg font-bold text-gray-900">{analyticsData.totalRecords}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Rainy Days</p>
                  <p className="text-lg font-bold text-blue-600">{analyticsData.rainyDays}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default WeatherAnalyticsPage;
