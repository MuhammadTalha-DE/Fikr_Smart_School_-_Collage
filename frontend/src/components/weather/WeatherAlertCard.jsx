import { AlertTriangle, CloudRain, Sun, Cloud, Wind, CloudLightning, Gauge, X, ChevronRight } from 'lucide-react';

const alertIcons = {
  rain: CloudRain,
  heat: Sun,
  fog: Cloud,
  storm: CloudLightning,
  aqi: Gauge,
  wind: Wind,
  manual: AlertTriangle,
};

const severityStyles = {
  critical: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  high: { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', label: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  medium: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  low: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
};

const WeatherAlertCard = ({ alert, onResolve, onView }) => {
  if (!alert) return null;

  const Icon = alertIcons[alert.type] || AlertTriangle;
  const styles = severityStyles[alert.severity] || severityStyles.medium;
  const timeAgo = alert.createdAt
    ? Math.round((Date.now() - new Date(alert.createdAt)) / 60000)
    : 0;
  const timeDisplay = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${styles.bg}`}>
      <div className={`p-2.5 rounded-lg ${styles.badge}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
            {alert.severity.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">{timeDisplay}</span>
          {alert.isAutomatic && (
            <span className="text-xs text-gray-400">• Auto</span>
          )}
        </div>
        <p className="font-medium text-gray-900">{alert.title}</p>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
        {alert.targetRoles?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {alert.targetRoles.map(role => (
              <span key={role} className="text-xs px-1.5 py-0.5 rounded bg-white/50 text-gray-500">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {onView && (
          <button onClick={() => onView(alert)} className="p-1.5 rounded-lg hover:bg-white/50 transition">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {onResolve && alert.isActive && (
          <button onClick={() => onResolve(alert._id)} className="p-1.5 rounded-lg hover:bg-white/50 transition" title="Resolve alert">
            <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WeatherAlertCard;
