import React from 'react';
import { 
  AlertTriangle, Bell, Cloud, Bus, Home, Shield, Activity, 
  XCircle, CheckCircle, Clock, ChevronRight 
} from 'lucide-react';

const severityConfig = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', icon: AlertTriangle },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', icon: Bell },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', icon: Activity },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', icon: Shield },
};

const typeIcons = {
  emergency: AlertTriangle,
  weather: Cloud,
  transport: Bus,
  hostel: Home,
  medical: Activity,
  security: Shield,
  fire: AlertTriangle,
  natural_disaster: Cloud,
  lockdown: XCircle,
  other: Bell,
};

const EmergencyAlertCard = ({ alert, onView, onAcknowledge, onResolve, compact = false }) => {
  const config = severityConfig[alert.severity] || severityConfig.medium;
  const TypeIcon = typeIcons[alert.type] || Bell;
  const SeverityIcon = config.icon;

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (compact) {
    return (
      <div 
        className={`p-4 rounded-xl border ${config.bg} ${config.border} cursor-pointer 
          transition-all hover:scale-[1.02] hover:shadow-lg`}
        onClick={() => onView?.(alert)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <TypeIcon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.text} truncate`}>{alert.title}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{alert.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${config.badge}`}>
                {alert.severity}
              </span>
              <span className="text-xs text-gray-500">{formatTime(alert.createdAt)}</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${config.text} flex-shrink-0`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-lg ${config.bg} ${config.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.bg}`}>
            <SeverityIcon className={`w-6 h-6 ${config.text}`} />
          </div>
          <div>
            <h4 className="font-bold text-white">{alert.title}</h4>
            <p className="text-sm text-gray-400">
              <TypeIcon className="w-3.5 h-3.5 inline mr-1" />
              {alert.type?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badge}`}>
          {alert.severity}
        </span>
      </div>

      {/* Body */}
      <p className="text-gray-300 text-sm mb-4 ml-12">{alert.message}</p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 ml-12">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(alert.createdAt)}
          </span>
          {alert.createdBy?.name && (
            <span>by {alert.createdBy.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {alert.status === 'active' && (
            <>
              {onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert._id)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {onResolve && (
                <button
                  onClick={() => onResolve(alert._id)}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs transition-colors"
                >
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Resolve
                </button>
              )}
            </>
          )}
          {alert.status === 'resolved' && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Resolved
            </span>
          )}
        </div>
      </div>

      {/* Acknowledged count */}
      {alert.acknowledgedBy?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
          <span>{alert.acknowledgedBy.length} person(s) acknowledged</span>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertCard;
