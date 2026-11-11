import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Plus, Filter, X } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getWeatherAlerts, createWeatherAlert, resolveWeatherAlert } from '../../services/weatherService';
import WeatherAlertCard from '../../components/weather/WeatherAlertCard';
import WeatherAlertForm from '../../components/weather/WeatherAlertForm';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';

const WeatherAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getWeatherAlerts();
      setAlerts(res.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (formData) => {
    try {
      await createWeatherAlert(formData);
      setShowCreateForm(false);
      fetchAlerts();
    } catch (err) {
      alert('Failed to create alert: ' + err.message);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await resolveWeatherAlert(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  const activeAlerts = filteredAlerts.filter(a => a.isActive !== false);

  const alertTypes = ['all', ...new Set(alerts.map(a => a.type))];
  const severityTypes = ['all', 'low', 'medium', 'high', 'critical'];

  return (
    <Layout role="admin">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weather Alerts</h1>
            <p className="text-sm text-gray-500">
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancel' : 'Create Alert'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <WeatherAlertForm
          onSubmit={handleCreateAlert}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
        >
          {alertTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
        >
          {severityTypes.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filteredAlerts.length} alerts</span>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <WeatherEmptyState message={error} onRetry={fetchAlerts} />
      ) : filteredAlerts.length === 0 ? (
        <WeatherEmptyState
          message="No alerts found"
          subtitle={alerts.length > 0 ? 'No alerts match your filter criteria.' : 'Weather alerts will appear here when created.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <WeatherAlertCard
              key={alert._id}
              alert={alert}
              onResolve={alert.isActive !== false ? handleResolveAlert : undefined}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-red-50">
              <p className="text-lg font-bold text-red-600">{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}</p>
              <p className="text-xs text-red-500">Critical/High</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-50">
              <p className="text-lg font-bold text-amber-600">{alerts.filter(a => a.severity === 'medium').length}</p>
              <p className="text-xs text-amber-500">Medium</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50">
              <p className="text-lg font-bold text-blue-600">{alerts.filter(a => a.severity === 'low').length}</p>
              <p className="text-xs text-blue-500">Low</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <p className="text-lg font-bold text-emerald-600">{alerts.filter(a => !a.isActive || a.isActive === false).length}</p>
              <p className="text-xs text-emerald-500">Resolved</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default WeatherAlertsPage;
