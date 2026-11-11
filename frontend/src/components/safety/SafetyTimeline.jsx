import React from 'react';
import { 
  AlertTriangle, Bell, FileText, CheckCircle, Clock, User,
  Activity, Shield, Home, Bus, Cloud, XCircle 
} from 'lucide-react';

const eventIcons = {
  alert_created: AlertTriangle,
  alert_resolved: CheckCircle,
  incident_reported: FileText,
  incident_resolved: CheckCircle,
  sos_activated: AlertTriangle,
  system: Activity,
};

const typeColors = {
  alert_created: 'bg-red-500/20 text-red-400 border-red-500/30',
  alert_resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  incident_reported: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  incident_resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sos_activated: 'bg-red-600/20 text-red-500 border-red-600/30',
  system: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const SafetyTimeline = ({ events = [], loading }) => {
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-500/50 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No safety events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500/30 via-amber-500/30 to-emerald-500/30" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type] || Activity;
          const colorClass = typeColors[event.type] || typeColors.system;

          return (
            <div key={event._id || index} className="relative flex gap-4 pl-0">
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.createdAt || event.timestamp)}
                    </span>
                    {event.user && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.user}
                      </span>
                    )}
                    {event.severity && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        event.severity === 'critical' ? 'text-red-400 bg-red-500/10' :
                        event.severity === 'high' ? 'text-orange-400 bg-orange-500/10' :
                        'text-amber-400 bg-amber-500/10'
                      }`}>
                        {event.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SafetyTimeline;
