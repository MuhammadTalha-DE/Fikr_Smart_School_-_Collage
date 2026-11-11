import { RefreshCw, Bell, Settings, Download, Activity } from 'lucide-react';
import { useState } from 'react';

const WeatherActionPanel = ({ onRefresh, onAlerts, onSettings, onExport, onAnalytics, refreshing = false }) => {
  const [showMenu, setShowMenu] = useState(false);

  const actions = [
    { icon: RefreshCw, label: 'Refresh Data', onClick: onRefresh, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', loading: refreshing },
    { icon: Bell, label: 'Manage Alerts', onClick: onAlerts, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { icon: Settings, label: 'Weather Settings', onClick: onSettings, color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
    { icon: Download, label: 'Export Report', onClick: onExport, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { icon: Activity, label: 'View Analytics', onClick: onAnalytics, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <Activity className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="hidden lg:grid lg:grid-cols-5 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={action.loading}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 transition-all ${action.color} ${
              action.loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <action.icon className={`w-4 h-4 ${action.loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile dropdown */}
      {showMenu && (
        <div className="lg:hidden space-y-2 mt-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick?.(); setShowMenu(false); }}
              disabled={action.loading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 transition-all ${action.color} ${
                action.loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <action.icon className={`w-4 h-4 ${action.loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherActionPanel;
