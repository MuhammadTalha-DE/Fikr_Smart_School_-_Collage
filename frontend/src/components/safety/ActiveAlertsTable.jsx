import React from 'react';
import { 
  AlertTriangle, Bell, Cloud, Bus, Home, Shield, Activity, 
  XCircle, CheckCircle, Clock, MoreVertical, Eye, Trash2 
} from 'lucide-react';

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

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400',
  resolved: 'bg-slate-500/20 text-slate-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
};

const ActiveAlertsTable = ({ alerts = [], onView, onResolve, onDelete, loading }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">All Clear!</p>
        <p className="text-gray-500 text-sm">No active alerts at the moment</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Alert</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Severity</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">By</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const TypeIcon = typeIcons[alert.type] || Bell;
            return (
              <tr 
                key={alert._id} 
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onView?.(alert)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <TypeIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {alert.title}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-400 capitalize">
                  {alert.type?.replace('_', ' ')}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs border ${severityColors[alert.severity] || severityColors.medium}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs ${statusColors[alert.status] || statusColors.active}`}>
                    {alert.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {formatDate(alert.createdAt)}
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {alert.createdBy?.name || 'System'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onView?.(alert)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {alert.status === 'active' && onResolve && (
                      <button
                        onClick={() => onResolve(alert._id)}
                        className="p-2 rounded-lg hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors"
                        title="Resolve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(alert._id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveAlertsTable;
