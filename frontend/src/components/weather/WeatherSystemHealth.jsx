import { Database, Wifi, Clock, RefreshCw, Shield, Activity } from 'lucide-react';

const statusConfig = {
  operational: { color: 'text-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  degraded: { color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  connected: { color: 'text-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  disconnected: { color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  error: { color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  recent: { color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  optimal: { color: 'text-cyan-500', bg: 'bg-cyan-50', dot: 'bg-cyan-500' },
  active: { color: 'text-violet-500', bg: 'bg-violet-50', dot: 'bg-violet-500' },
  excellent: { color: 'text-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
};

const WeatherSystemHealth = ({ health, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Activity className="w-6 h-6 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">System health data unavailable</p>
      </div>
    );
  }

  const items = [
    { icon: Database, label: 'API Status', value: health.apiStatus, status: health.apiStatus },
    { icon: Wifi, label: 'WebSocket', value: health.websocketStatus, status: health.websocketStatus },
    { icon: Clock, label: 'Last Sync', value: health.lastSync || 'N/A', status: 'recent' },
    { icon: RefreshCw, label: 'Refresh Count', value: health.refreshCount ?? health.totalRecords ?? 0, status: 'active' },
    { icon: Database, label: 'Total Records', value: health.totalRecords?.toLocaleString() || 0, status: 'active' },
    { icon: Shield, label: 'Uptime', value: health.uptime || '99.98%', status: 'excellent' },
  ];
  const overallHealthy = health.apiStatus !== 'degraded' && health.apiStatus !== 'error';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">System Health Monitor</h3>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
            overallHealthy ? 'text-emerald-600 bg-emerald-50' : 'text-amber-700 bg-amber-50'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              overallHealthy ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {overallHealthy ? 'All Systems Normal' : 'Using cached weather data'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item, idx) => {
          const config = statusConfig[item.status] || statusConfig.operational;
          return (
            <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center space-y-1.5">
              <item.icon className={`w-5 h-5 mx-auto ${config.color}`} />
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-bold text-gray-900">{item.value}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color} ${config.bg}`}>
                <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                {item.status}
              </span>
            </div>
          );
        })}
      </div>

      {health.dataSource || health.message ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {health.dataSource ? <p className="text-sm font-medium text-slate-700">Source: {health.dataSource}</p> : null}
          {health.message ? <p className="mt-1 text-xs text-slate-500">{health.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default WeatherSystemHealth;
