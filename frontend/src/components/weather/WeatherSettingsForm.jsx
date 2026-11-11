import { useState, useEffect } from 'react';
import { Save, MapPin, Clock, Bell, Gauge } from 'lucide-react';

const WeatherSettingsForm = ({ settings, onSave, loading }) => {
  const [form, setForm] = useState({
    locationName: '',
    latitude: '',
    longitude: '',
    refreshIntervalMinutes: 10,
    autoAlertsEnabled: true,
    thresholds: {
      highTemperature: 38,
      heavyRain: 10,
      poorAQI: 150,
      strongWind: 30,
      lowVisibility: 3,
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        locationName: settings.locationName || '',
        latitude: settings.latitude?.toString() || '',
        longitude: settings.longitude?.toString() || '',
        refreshIntervalMinutes: settings.refreshIntervalMinutes || 10,
        autoAlertsEnabled: settings.autoAlertsEnabled ?? true,
        thresholds: {
          ...form.thresholds,
          ...settings.thresholds,
        },
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        locationName: form.locationName,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        refreshIntervalMinutes: parseInt(form.refreshIntervalMinutes),
        autoAlertsEnabled: form.autoAlertsEnabled,
        thresholds: form.thresholds,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Weather Settings</h3>

      {/* Location */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 text-blue-500" />
          Location Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Location Name</label>
            <input
              type="text"
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Zoormandi, Malakand"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="34.6342"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="71.8440"
            />
          </div>
        </div>
      </div>

      {/* Refresh */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4 text-cyan-500" />
          Data Refresh
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Refresh Interval (minutes)</label>
            <select
              value={form.refreshIntervalMinutes}
              onChange={(e) => setForm({ ...form, refreshIntervalMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>Every 5 minutes</option>
              <option value={10}>Every 10 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoAlertsEnabled}
                onChange={(e) => setForm({ ...form, autoAlertsEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Auto Alerts</span>
                <p className="text-xs text-gray-400">Automatically generate weather alerts</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Gauge className="w-4 h-4 text-orange-500" />
          Alert Thresholds
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">High Temp (°C)</label>
            <input
              type="number"
              value={form.thresholds.highTemperature}
              onChange={(e) => setForm({ ...form, thresholds: { ...form.thresholds, highTemperature: parseInt(e.target.value) } })}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Heavy Rain (mm)</label>
            <input
              type="number"
              value={form.thresholds.heavyRain}
              onChange={(e) => setForm({ ...form, thresholds: { ...form.thresholds, heavyRain: parseInt(e.target.value) } })}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Poor AQI</label>
            <input
              type="number"
              value={form.thresholds.poorAQI}
              onChange={(e) => setForm({ ...form, thresholds: { ...form.thresholds, poorAQI: parseInt(e.target.value) } })}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Strong Wind (km/h)</label>
            <input
              type="number"
              value={form.thresholds.strongWind}
              onChange={(e) => setForm({ ...form, thresholds: { ...form.thresholds, strongWind: parseInt(e.target.value) } })}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Low Visibility (km)</label>
            <input
              type="number"
              step="0.1"
              value={form.thresholds.lowVisibility}
              onChange={(e) => setForm({ ...form, thresholds: { ...form.thresholds, lowVisibility: parseFloat(e.target.value) } })}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export default WeatherSettingsForm;
